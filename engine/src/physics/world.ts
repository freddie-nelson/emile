import { TypedBody } from "../matter";
import { CircleCollider, Collider, ColliderEvent, PolygonCollider, RectangleCollider } from "./collider";
import { Rigidbody } from "./rigidbody";
import { Transform } from "../core/transform";
import { Vec2 } from "../math/vec";
import { Entity } from "../ecs/entity";
import { System, SystemType, SystemUpdateData } from "../ecs/system";
import Matter, { Body, Collision } from "matter-js";
import { Constraint } from "./constraint";
import { Logger } from "@shared/src/Logger";
import { Registry } from "../ecs/registry";
import raycast, { RayCol, RayColSimple } from "./raycast";
import SceneGraph from "../scene/sceneGraph";
import World from "../scene/world";
import { EngineType } from "../engine";

export interface QueryResult {
  body: TypedBody;
  entity: string;
}

export interface QueryResultWithCollision extends QueryResult {
  collision: Collision;
}

export interface PhysicsWorldOptions {
  gravity: Vec2;
  positionIterations: number;
  velocityIterations: number;
  slop: number;
  world: World;
  runOnClient: boolean;
}

/**
 * Represents a physics world.
 *
 * The physics world has a system priority of 0. You can give your systems a higher priority to run before the physics world.
 */
export class PhysicsWorld extends System {
  /**
   * This is the scaling factor applied to the gravity force.
   *
   * This allows you to use reasonable values for gravity in your game (e.g. 9.81) and have them converted to the very small force values for the physics engine.
   *
   * You don't need to change this, just change the gravity in the physics world options.
   */
  public static readonly GRAVITY_FORCE_SCALE = 1 / 800000;

  public static getCollider(entity: Entity): Collider | null {
    if (Entity.hasComponent(entity, RectangleCollider)) {
      return Entity.getComponent(entity, RectangleCollider);
    } else if (Entity.hasComponent(entity, CircleCollider)) {
      return Entity.getComponent(entity, CircleCollider);
    } else if (Entity.hasComponent(entity, PolygonCollider)) {
      return Entity.getComponent(entity, PolygonCollider);
    }

    return null;
  }

  private readonly engine: Matter.Engine;
  private readonly bodies: Map<string, TypedBody> = new Map();
  private readonly matterBodies: Map<TypedBody, string> = new Map();
  private readonly lastCollider: Map<string, Collider | null> = new Map();
  private readonly constraints: Map<string, Matter.Constraint> = new Map();
  private readonly options: PhysicsWorldOptions;
  private readonly collisionEvents: Map<ColliderEvent, Matter.Pair[]> = new Map();

  private readonly sceneGraph: SceneGraph;
  private readonly registry: Registry;

  /**
   * Creates a new physics world.
   *
   * @param options The options for the physics world.
   */
  constructor(options: PhysicsWorldOptions) {
    super(SystemType.SERVER_AND_CLIENT, new Set([Transform, Rigidbody]), 0, true);

    this.options = { ...options };
    this.registry = this.options.world.registry;
    this.sceneGraph = this.options.world.sceneGraph;

    this.engine = Matter.Engine.create({
      positionIterations: options.positionIterations,
      velocityIterations: options.velocityIterations,
      gravity: {
        x: 0,
        y: 0,
      },
    });
    this.setGravity(this.options.gravity);

    this.setupMatterEvents();
  }

  public fixedUpdate = ({ engine, registry, entities, dt }: SystemUpdateData) => {
    // if the engine is a client, we don't need to run the physics world (this is handled by the server)
    if (engine.type === EngineType.CLIENT && !this.options.runOnClient) {
      return;
    }

    // deletion step
    for (const entity of this.bodies.keys()) {
      // body no longer has required components for physics
      if (!entities.has(entity)) {
        this.deleteBody(entity);
      }
    }

    // constraint deletion step
    for (const entity of this.constraints.keys()) {
      const e = registry.get(entity);

      // constraint no longer has required components for physics
      if (!entities.has(entity) || !Entity.hasComponent(e, Constraint)) {
        this.deleteConstraint(entity);
      }

      const constraint = Entity.getComponent(e, Constraint);

      // entity B no longer exists or is not a valid physics entity anymore
      if (!registry.has(constraint.entityBId) || !this.bodies.has(constraint.entityBId)) {
        this.deleteConstraint(entity);
      }
    }

    // creation step
    for (const entity of entities) {
      const e = registry.get(entity);

      const rigidbody = Entity.getComponent(e, Rigidbody);
      const collider = PhysicsWorld.getCollider(e);
      const lastCollider = this.lastCollider.get(entity);
      this.lastCollider.set(entity, collider);

      const bodyNeedsCreated =
        !Rigidbody.getBody(rigidbody) ||
        (collider && !Collider.getBody(collider)) ||
        (!collider && lastCollider) ||
        (collider && !lastCollider) ||
        !this.matterBodies.has(Rigidbody.getBody(rigidbody)!) ||
        collider?.type !== Rigidbody.getBody(rigidbody)!.plugin!.colliderType;

      // if the body needs to be created and it already exists, remove it
      if (bodyNeedsCreated && this.bodies.has(entity)) {
        this.deleteBody(entity);
      }

      // if the body needs to be created, create it
      if (bodyNeedsCreated) {
        this.createBody(e);
      }

      // update from rigidbody
      const body = Rigidbody.getBody(rigidbody)!;

      if (rigidbody.velocity.x !== body.velocity.x || rigidbody.velocity.y !== body.velocity.y) {
        Matter.Body.setVelocity(body, rigidbody.velocity);
      }

      if (rigidbody.angularVelocity !== body.angularVelocity) {
        Matter.Body.setAngularVelocity(body, rigidbody.angularVelocity);
      }

      if (rigidbody.gravityScale !== body.plugin!.gravityScale) {
        body.plugin!.gravityScale = rigidbody.gravityScale;
      }

      // update from transform
      const transform = this.sceneGraph.getWorldTransform(e.id);

      if (transform.position.x !== body.position.x || transform.position.y !== body.position.y) {
        Matter.Body.setPosition(body, transform.position);
      }
      if (transform.rotation !== body.angle) {
        Matter.Body.setAngle(body, transform.rotation);
      }

      const scale = body.plugin!.bodyScale;
      if (scale && (scale.x !== transform.scale.x || scale.y !== transform.scale.y)) {
        Matter.Body.scale(body, transform.scale.x / scale.x, transform.scale.y / scale.y);
        body.plugin!.bodyScale = Vec2.copy(transform.scale);
      }
    }

    // constraint creation step
    for (const entity of entities) {
      const e = registry.get(entity);

      if (!Entity.hasComponent(e, Constraint)) {
        continue;
      }

      const constraint = Entity.getComponent(e, Constraint);

      // constraint needs to be created but already exists, remove it
      if (!Constraint.getConstraint(constraint) && this.constraints.has(entity)) {
        this.deleteConstraint(entity);
      }

      // constraint needs to be created, create it
      if (!Constraint.getConstraint(constraint)) {
        if (!registry.has(constraint.entityBId)) {
          Logger.errorAndThrow(
            "CORE",
            `Entity B with id '${constraint.entityBId}' does not exist for constraint.`,
          );
        }

        this.createConstraint(e, registry.get(constraint.entityBId));
      }
    }

    // apply gravity
    for (const body of this.bodies.values()) {
      const gravityScale = body.plugin?.gravityScale ?? 1;
      if (!gravityScale) {
        continue;
      }

      Body.applyForce(body, body.position, {
        x: this.options.gravity.x * body.mass * gravityScale * PhysicsWorld.GRAVITY_FORCE_SCALE,
        y: this.options.gravity.y * body.mass * gravityScale * PhysicsWorld.GRAVITY_FORCE_SCALE,
      });
    }

    // update step
    Matter.Engine.update(this.engine, dt * 1000);

    // sync step
    for (const entity of entities) {
      const e = registry.get(entity);

      const rigidbody = Entity.getComponent(e, Rigidbody);

      const body = Rigidbody.getBody(rigidbody);
      if (!body) {
        continue;
      }

      Rigidbody.update(rigidbody);

      const collider = PhysicsWorld.getCollider(e);
      if (collider) {
        Collider.update(collider);
      }

      const transform = Entity.getComponent(e, Transform);
      const localTransform = this.sceneGraph.toLocalTransform(e.id, {
        position: new Vec2(body.position.x, body.position.y),
        rotation: body.angle,
        scale: body.plugin!.bodyScale!,
        zIndex: transform.zIndex,
      });

      transform.position.x = localTransform.position.x;
      transform.position.y = localTransform.position.y;
      transform.rotation = localTransform.rotation;
    }

    this.flushMatterCollisionEvents();
  };

  /**
   * Sets the gravity of the physics world.
   *
   * @param gravity The gravity to set.
   */
  public setGravity(gravity: Vec2) {
    this.options.gravity = gravity;
  }

  /**
   * Gets the gravity of the physics world.
   *
   * @returns The gravity of the physics world.
   */
  public getGravity() {
    return this.options.gravity;
  }

  /**
   *	Queries the world for bodies that intersect with a ray.
   *
   * @param start The start of the ray.
   * @param end The end of the ray.
   * @param entities The entities to query. Optional. Defaults to all physics entities. Can improve performance if you only want to check a subset of entities.
   *
   * @returns The bodies that intersect with the ray.
   */
  public queryRay(start: Vec2, end: Vec2, entities?: Iterable<string>): RayCol[];

  /**
   * Queries the world for bodies that intersect with a ray.
   *
   * @param origin The origin of the ray.
   * @param dir The direction of the ray.
   * @param len The length of the ray.
   * @param entities The entities to query. Optional. Defaults to all physics entities. Can improve performance if you only want to check a subset of entities.
   *
   * @returns The bodies that intersect with the ray.
   */
  public queryRay(origin: Vec2, dir: Vec2, len: number, entities?: Iterable<string>): RayCol[];

  public queryRay(
    origin: Vec2,
    dir: Vec2,
    len?: number | Iterable<string>,
    entities?: Iterable<string>,
  ): RayCol[] {
    if (typeof len === "number") {
      return this.queryRay(origin, Vec2.add(origin, Vec2.mul(dir, len)), entities);
    } else {
      let bodies = [];
      if (len) {
        for (const entity of len) {
          if (this.bodies.has(entity)) {
            bodies.push(this.bodies.get(entity)!);
          }
        }
      } else {
        bodies = this.engine.world.bodies;
      }

      return raycast(bodies, origin, dir);
    }
  }

  /**
   * Queries the world for bodies that intersect with a ray.
   *
   * This is a quick version of the queryRay method that does not return intersection information.
   *
   * @param origin The origin of the ray.
   * @param dir The direction of the ray.
   * @param len The length of the ray.
   * @param entities The entities to query. Optional. Defaults to all physics entities. Can improve performance if you only want to check a subset of entities.
   */
  public queryRayQuick(origin: Vec2, dir: Vec2, len: number, entities?: Iterable<string>): RayColSimple[];

  /**
   * Queries the world for bodies that intersect with a ray.
   *
   * This is a quick version of the queryRay method that does not return intersection information.
   *
   * @param start The start of the ray.
   * @param end The end of the ray.
   * @param entities The entities to query. Optional. Defaults to all physics entities. Can improve performance if you only want to check a subset of entities.
   */
  public queryRayQuick(start: Vec2, end: Vec2, entities?: Iterable<string>): RayColSimple[];

  public queryRayQuick(
    origin: Vec2,
    dir: Vec2,
    len?: number | Iterable<string>,
    entities?: Iterable<string>,
  ): RayColSimple[] {
    if (typeof len === "number") {
      return this.queryRayQuick(origin, Vec2.add(origin, Vec2.mul(dir, len)), entities);
    } else {
      let bodies = [];
      if (len) {
        for (const entity of len) {
          if (this.bodies.has(entity)) {
            bodies.push(this.bodies.get(entity)!);
          }
        }
      } else {
        bodies = this.engine.world.bodies;
      }

      const res = Matter.Query.ray(bodies, origin, dir);
      // console.log(res.length, bodies.length, origin.x, origin.y, dir.x, dir.y);

      return res.map((c) => new RayColSimple(c.bodyA, c.normal)).filter((c) => c.entity);
    }
  }

  /**
   * Queries the world for bodies that intersect with a circle.
   *
   * @param center The center of the circle.
   * @param radius The radius of the circle.
   *
   * @returns The bodies that intersect with the circle.
   */
  public queryCircle(center: Vec2, radius: number): QueryResultWithCollision[] {
    const circle = Matter.Bodies.circle(center.x, center.y, radius, {
      isSensor: true,
      isStatic: true,
    });

    const res = Matter.Query.collides(circle, this.engine.world.bodies)
      .filter(
        (c) =>
          (c.bodyA as TypedBody).plugin?.entity && this.registry.has((c.bodyA as TypedBody).plugin!.entity!),
      )
      .map((c) => {
        return {
          body: c.bodyA as TypedBody,
          entity: c.bodyA.plugin!.entity,
          collision: c,
        };
      });

    Matter.World.remove(this.engine.world, circle);

    return res;
  }

  /**
   * Queries the world for bodies that are inside an AABB.
   *
   * @param min The minimum point of the AABB.
   * @param max The maximum point of the AABB.
   *
   * @returns The bodies that intersect with the AABB.
   */
  public queryAABB(min: Vec2, max: Vec2): QueryResult[] {
    const aabb = Matter.Bounds.create([
      new Vec2(min.x, min.y),
      new Vec2(min.x, max.y),
      new Vec2(max.x, min.y),
      new Vec2(max.x, max.y),
    ]);

    return Matter.Query.region(this.engine.world.bodies, aabb)
      .filter((b) => (b as TypedBody).plugin?.entity && this.registry.has((b as TypedBody).plugin!.entity!))
      .map((b) => {
        return {
          body: b as TypedBody,
          entity: (b as TypedBody).plugin!.entity!,
        };
      });
  }

  private createBody(entity: Entity) {
    const transform = Entity.getComponent(entity, Transform);
    const rigidbody = Entity.getComponent(entity, Rigidbody);

    let body: TypedBody;
    let collider: Collider | null = null;

    if (Entity.hasComponent(entity, RectangleCollider)) {
      const c = Entity.getComponent(entity, RectangleCollider);
      collider = c;

      body = Matter.Bodies.rectangle(transform.position.x, transform.position.y, c.width, c.height, {
        isSensor: c.isSensor,
      });

      body.plugin = {};
      body.plugin.rectangleWidth = c.width;
      body.plugin.rectangleHeight = c.height;
    } else if (Entity.hasComponent(entity, CircleCollider)) {
      const c = Entity.getComponent(entity, CircleCollider);
      collider = c;

      body = Matter.Bodies.circle(transform.position.x, transform.position.y, c.radius, {
        isSensor: c.isSensor,
      });

      body.plugin = {};
      body.plugin.circleRadius = c.radius;
    } else if (Entity.hasComponent(entity, PolygonCollider)) {
      const c = Entity.getComponent(entity, PolygonCollider);
      collider = c;

      body = Matter.Bodies.fromVertices(
        transform.position.x,
        transform.position.y,
        [c.vertices.map((v) => Vec2.copy(v))],
        {
          isSensor: c.isSensor,
        },
      );

      body.plugin = {};
      body.plugin.polygonVertices = c.vertices.map((v) => Vec2.copy(v));
    } else {
      body = Matter.Bodies.circle(transform.position.x, transform.position.y, 0.1, {
        isSensor: true,
      });
      body.plugin = {};
    }

    Matter.Body.scale(body, transform.scale.x, transform.scale.y);

    body.plugin.entity = entity.id;
    body.plugin.colliderType = collider?.type;
    body.plugin.bodyScale = Vec2.copy(transform.scale);
    body.plugin.gravityScale = rigidbody.gravityScale;

    body.slop = this.options.slop;

    Rigidbody.setBody(rigidbody, body);

    Rigidbody.setVelocity(rigidbody, rigidbody.velocity);
    Rigidbody.setAngularVelocity(rigidbody, rigidbody.angularVelocity);
    Rigidbody.setDensity(rigidbody, rigidbody.density);
    Rigidbody.setRestitution(rigidbody, rigidbody.restitution);
    Rigidbody.setInertia(rigidbody, rigidbody.inertia);
    Rigidbody.setFriction(rigidbody, rigidbody.friction);
    Rigidbody.setFrictionAir(rigidbody, rigidbody.frictionAir);
    Rigidbody.setFrictionStatic(rigidbody, rigidbody.frictionStatic);
    Rigidbody.setIsStatic(rigidbody, rigidbody.isStatic);

    if (collider) {
      Collider.setBody(collider, body);

      Collider.setSensor(collider, collider.isSensor);
      Collider.setCollisionGroup(collider, collider.group);
      Collider.setCollisionCategory(collider, collider.category);
      Collider.setCollisionMask(collider, collider.mask);
    }

    this.bodies.set(entity.id, body);
    this.matterBodies.set(body, entity.id);
    this.lastCollider.set(entity.id, collider);

    Matter.World.add(this.engine.world, body);
  }

  private createConstraint(entityA: Entity, entityB: Entity) {
    const constraint = Entity.getComponent(entityA, Constraint);

    const bodyA = this.bodies.get(entityA.id)!;
    const bodyB = this.bodies.get(entityB.id)!;
    if (!bodyA || !bodyB) {
      Logger.errorAndThrow("CORE", "Missing bodies during constraint creation.");
    }

    const c = Matter.Constraint.create({
      bodyA,
      bodyB,
      pointA: constraint.pointA,
      pointB: constraint.pointB,
      stiffness: constraint.stiffness,
      damping: constraint.damping,
      length: constraint.length === -1 ? undefined : constraint.length,
    });

    Constraint.setConstraint(constraint, c);
    this.constraints.set(entityA.id, c);

    Matter.World.add(this.engine.world, c);
  }

  private deleteBody(entity: string) {
    Matter.World.remove(this.engine.world, this.bodies.get(entity)!);
    this.matterBodies.delete(this.bodies.get(entity)!);
    this.bodies.delete(entity);
    this.lastCollider.delete(entity);
  }

  private deleteConstraint(entity: string) {
    Matter.World.remove(this.engine.world, this.constraints.get(entity)!);
    this.constraints.delete(entity);
  }

  private setupMatterEvents() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_START_INSTANT, event.pairs);
      this.queueMatterCollisionEvent(ColliderEvent.COLLISION_START, event.pairs);
    });

    Matter.Events.on(this.engine, "collisionEnd", (event) => {
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_END_INSTANT, event.pairs);
      this.queueMatterCollisionEvent(ColliderEvent.COLLISION_END, event.pairs);
    });

    Matter.Events.on(this.engine, "collisionActive", (event) => {
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_ACTIVE_INSTANT, event.pairs);
      this.queueMatterCollisionEvent(ColliderEvent.COLLISION_ACTIVE, event.pairs);
    });
  }

  private queueMatterCollisionEvent(type: ColliderEvent, pairs: Matter.Pair[]) {
    const existing = this.collisionEvents.get(type) || [];
    existing.push(...pairs);

    this.collisionEvents.set(type, existing);
  }

  private flushMatterCollisionEvents() {
    for (const [type, pairs] of this.collisionEvents) {
      this.onMatterCollisionEvent(type, pairs);
    }

    this.collisionEvents.clear();
  }

  private onMatterCollisionEvent(type: ColliderEvent, pairs: Matter.Pair[]) {
    for (const pair of pairs) {
      if (!pair.bodyA.plugin || !pair.bodyB.plugin) {
        continue;
      }

      const entityA = (pair.bodyA as TypedBody).plugin!.entity;
      const entityB = (pair.bodyB as TypedBody).plugin!.entity;
      if (!entityA || !entityB || !this.registry.has(entityA) || !this.registry.has(entityB)) {
        continue;
      }

      const eA = this.registry.get(entityA);
      const eB = this.registry.get(entityB);

      const colliderA = PhysicsWorld.getCollider(eA);
      const colliderB = PhysicsWorld.getCollider(eB);

      if (colliderA) {
        Collider.fire(colliderA, type, pair, eA, eB);
      }
      if (colliderB) {
        Collider.fire(colliderB, type, pair, eB, eA);
      }
    }
  }
}

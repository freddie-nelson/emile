import { TypedBody } from "../matter";
import { CircleCollider, Collider, ColliderEvent, PolygonCollider, RectangleCollider } from "./collider";
import { Rigidbody } from "./rigidbody";
import { Transform } from "../core/transform";
import { Vec2 } from "../math/vec";
import { Entity } from "../ecs/entity";
import { System, SystemType, SystemUpdateData } from "../ecs/system";
import Matter from "matter-js";
import { Constraint } from "./constraint";
import { Logger } from "@shared/src/Logger";
import { Registry } from "../ecs/registry";
import raycast, { RayCol } from "./raycast";

export interface PhysicsWorldOptions {
  gravity: Vec2;
  positionIterations: number;
  velocityIterations: number;
  slop: number;
}

/**
 * Represents a physics world.
 *
 * The physics world has a system priority of 0. You can give your systems a higher priority to run before the physics world.
 */
export class PhysicsWorld extends System {
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
  private readonly constraints: Map<string, Matter.Constraint> = new Map();
  private readonly options: PhysicsWorldOptions;
  private readonly collisionEvents: Map<ColliderEvent, Matter.Pair[]> = new Map();

  private lastRegistry?: Registry;

  /**
   * Creates a new physics world.
   *
   * @param options The options for the physics world.
   */
  constructor(options: PhysicsWorldOptions) {
    super(SystemType.SERVER_AND_CLIENT, new Set([Transform, Rigidbody]), 0);

    this.options = options;

    this.engine = Matter.Engine.create({
      positionIterations: options.positionIterations,
      velocityIterations: options.velocityIterations,
    });
    this.setGravity(options.gravity);

    this.setupMatterEvents();
  }

  public fixedUpdate = ({ registry, entities, dt }: SystemUpdateData) => {
    this.lastRegistry = registry;

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

      const bodyNeedsCreated =
        !Rigidbody.getBody(rigidbody) ||
        (collider && !Collider.getBody(collider)) ||
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

      // update from transform
      const transform = Entity.getComponent(e, Transform);

      if (transform.position.x !== body.position.x || transform.position.y !== body.position.y) {
        Matter.Body.setPosition(body, { x: transform.position.x, y: transform.position.y });
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
            `Entity B with id '${constraint.entityBId}' does not exist for constraint.`
          );
        }

        this.createConstraint(e, registry.get(constraint.entityBId));
      }
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
      transform.position.x = body.position.x;
      transform.position.y = body.position.y;
      transform.rotation = body.angle;
    }

    this.flushMatterCollisionEvents();
  };

  /**
   * Sets the gravity of the physics world.
   *
   * @param gravity The gravity to set.
   */
  public setGravity(gravity: Vec2) {
    this.engine.gravity.x = gravity.x;
    this.engine.gravity.y = gravity.y;
  }

  /**
   * Gets the gravity of the physics world.
   *
   * @returns The gravity of the physics world.
   */
  public getGravity() {
    return new Vec2(this.engine.gravity.x, this.engine.gravity.y);
  }

  /**
   *	Queries the world for bodies that intersect with a ray.
   *
   * @param start The start of the ray.
   * @param end The end of the ray.
   *
   * @returns The bodies that intersect with the ray.
   */
  public queryRay(start: Vec2, end: Vec2): RayCol[];

  /**
   * Queries the world for bodies that intersect with a ray.
   *
   * @param origin The origin of the ray.
   * @param dir The direction of the ray.
   * @param len The length of the ray.
   *
   * @returns The bodies that intersect with the ray.
   */
  public queryRay(origin: Vec2, dir: Vec2, len: number): RayCol[];

  public queryRay(origin: Vec2, dir: Vec2, len?: number) {
    if (typeof len === "number") {
      return this.queryRay(origin, Vec2.add(origin, Vec2.mul(dir, len)));
    } else {
      return raycast(Array.from(this.bodies.values()), origin, dir);
    }
  }

  private createBody(entity: Entity) {
    const transform = Entity.getComponent(entity, Transform);
    const rigidbody = Entity.getComponent(entity, Rigidbody);

    let body: TypedBody;
    let collider: Collider | null = null;

    if (Entity.hasComponent(entity, RectangleCollider)) {
      const c = Entity.getComponent(entity, RectangleCollider);
      collider = c;

      body = Matter.Bodies.rectangle(transform.position.x, transform.position.y, c.width, c.height);

      body.plugin = {};
      body.plugin.rectangleWidth = c.width;
      body.plugin.rectangleHeight = c.height;
    } else if (Entity.hasComponent(entity, CircleCollider)) {
      const c = Entity.getComponent(entity, CircleCollider);
      collider = c;

      body = Matter.Bodies.circle(transform.position.x, transform.position.y, c.radius);

      body.plugin = {};
      body.plugin.circleRadius = c.radius;
    } else if (Entity.hasComponent(entity, PolygonCollider)) {
      const c = Entity.getComponent(entity, PolygonCollider);
      collider = c;

      body = Matter.Bodies.fromVertices(transform.position.x, transform.position.y, [
        c.vertices.map((v) => Vec2.copy(v)),
      ]);

      body.plugin = {};
      body.plugin.polygonVertices = c.vertices.map((v) => Vec2.copy(v));
    } else {
      body = Matter.Bodies.circle(transform.position.x, transform.position.y, 0.1);
      body.plugin = {};
    }

    Matter.Body.scale(body, transform.scale.x, transform.scale.y);

    body.plugin.entity = entity.id;
    body.plugin.colliderType = collider?.type;
    body.plugin.bodyScale = Vec2.copy(transform.scale);

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
    if (!this.lastRegistry) {
      return;
    }

    for (const pair of pairs) {
      if (!pair.bodyA.plugin || !pair.bodyB.plugin) {
        continue;
      }

      const entityA = (pair.bodyA as TypedBody).plugin!.entity;
      const entityB = (pair.bodyB as TypedBody).plugin!.entity;
      if (!entityA || !entityB || !this.lastRegistry.has(entityA) || !this.lastRegistry.has(entityB)) {
        continue;
      }

      const eA = this.lastRegistry.get(entityA);
      const eB = this.lastRegistry.get(entityB);

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

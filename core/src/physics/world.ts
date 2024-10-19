import { TypedBody } from "../matter";
import {
  CircleCollider,
  Collider,
  ColliderEvent,
  PolygonCollider,
  RectangleCollider,
} from "../components/collider";
import { Rigidbody } from "../components/rigidbody";
import { Transform } from "../components/transform";
import { Vec2 } from "../math/vec";
import { Entity } from "@ecs/src/entity";
import { Registry } from "@ecs/src/registry";
import { System, SystemType } from "@ecs/src/system";
import Matter from "matter-js";
import { Constraint } from "../components/constraint";
import { Logger } from "@shared/src/Logger";

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
  private readonly engine: Matter.Engine;
  private readonly bodies: Map<Entity, Matter.Body> = new Map();
  private readonly constraints: Map<Entity, Matter.Constraint> = new Map();
  private readonly bodyScale: Map<Entity, Vec2> = new Map();
  private readonly options: PhysicsWorldOptions;

  /**
   * Creates a new physics world.
   *
   * @parma options The options for the physics world.
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

  public fixedUpdate = (registry: Registry, entities: Set<Entity>, dt: number) => {
    // deletion step
    for (const entity of this.bodies.keys()) {
      // body no longer has required components for physics
      if (!entities.has(entity)) {
        Matter.World.remove(this.engine.world, this.bodies.get(entity)!);
        this.bodies.delete(entity);
      }
    }

    // constraint deletion step
    for (const entity of this.constraints.keys()) {
      // constraint no longer has required components for physics
      if (!entities.has(entity) || !entity.hasComponent(Constraint)) {
        Matter.World.remove(this.engine.world, this.constraints.get(entity)!);
        this.constraints.delete(entity);
      }

      const constraint = entity.getComponent(Constraint);

      // entity B no longer exists or is not a valid physics entity anymore
      if (!registry.has(constraint.entityBId) || !this.bodies.has(registry.get(constraint.entityBId))) {
        Matter.World.remove(this.engine.world, this.constraints.get(entity)!);
        this.constraints.delete(entity);
      }
    }

    // creation step
    for (const entity of entities) {
      const rigidbody = entity.getComponent(Rigidbody);
      const collider = this.getCollider(entity);

      const bodyNeedsCreated = !rigidbody.getBody() || (collider && !collider.getBody());

      // if the body needs to be created and it already exists, remove it
      if (bodyNeedsCreated && this.bodies.has(entity)) {
        Matter.World.remove(this.engine.world, this.bodies.get(entity)!);
        this.bodies.delete(entity);
      }

      // if the body needs to be created, create it
      if (bodyNeedsCreated) {
        this.createBody(entity);
      }

      // update from transform
      const transform = entity.getComponent(Transform);
      const body = rigidbody.getBody()!;

      if (body.position.x !== transform.position.x || body.position.y !== transform.position.y) {
        Matter.Body.setPosition(body, { x: transform.position.x, y: body.position.y });
      }

      if (body.angle !== transform.rotation) {
        Matter.Body.setAngle(body, transform.rotation);
      }

      const scale = this.bodyScale.get(entity)!;
      if (scale.x !== transform.scale.x || scale.y !== transform.scale.y) {
        Matter.Body.scale(body, transform.scale.x / scale.x, transform.scale.y / scale.y);
        this.bodyScale.set(entity, transform.scale.copy());
      }
    }

    // constraint creation step
    for (const entity of entities) {
      if (!entity.hasComponent(Constraint)) {
        continue;
      }

      const constraint = entity.getComponent(Constraint);

      // constraint needs to be created but already exists, remove it
      if (!constraint.getConstraint() && this.constraints.has(entity)) {
        Matter.World.remove(this.engine.world, this.constraints.get(entity)!);
        this.constraints.delete(entity);
      }

      // constraint needs to be created, create it
      if (!constraint.getConstraint()) {
        if (!registry.has(constraint.entityBId)) {
          Logger.errorAndThrow(
            "CORE",
            `Entity B with id '${constraint.entityBId}' does not exist for constraint.`
          );
        }

        this.createConstraint(entity, registry.get(constraint.entityBId));
      }
    }

    // update step
    Matter.Engine.update(this.engine, dt);

    // sync step
    for (const entity of entities) {
      const rigidbody = entity.getComponent(Rigidbody);

      const body = rigidbody.getBody();
      if (!body) {
        continue;
      }

      rigidbody.update();

      const collider = this.getCollider(entity);
      collider?.update();

      const transform = entity.getComponent(Transform);
      if (body.position.x !== transform.position.x) {
        transform.position.x = body.position.x;
      }
      if (body.position.y !== transform.position.y) {
        transform.position.y = body.position.y;
      }
      if (body.angle !== transform.rotation) {
        transform.rotation = body.angle;
      }
    }
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

  private createBody(entity: Entity) {
    const transform = entity.getComponent(Transform);
    const rigidbody = entity.getComponent(Rigidbody);

    let body: TypedBody;
    let collider: Collider | null = null;

    if (entity.hasComponent(RectangleCollider)) {
      const c = entity.getComponent(RectangleCollider);
      collider = c;

      body = Matter.Bodies.rectangle(transform.position.x, transform.position.y, c.width, c.height);

      body.plugin = {};
      body.plugin.rectangleWidth = c.width;
      body.plugin.rectangleHeight = c.height;
    } else if (entity.hasComponent(CircleCollider)) {
      const c = entity.getComponent(CircleCollider);
      collider = c;

      body = Matter.Bodies.circle(transform.position.x, transform.position.y, c.radius);

      body.plugin = {};
      body.plugin.circleRadius = c.radius;
    } else if (entity.hasComponent(PolygonCollider)) {
      const c = entity.getComponent(PolygonCollider);
      collider = c;

      body = Matter.Bodies.fromVertices(transform.position.x, transform.position.y, [
        c.vertices.map((v) => v.copy()),
      ]);

      body.plugin = {};
      body.plugin.polygonVertices = c.vertices.map((v) => v.copy());
    } else {
      body = Matter.Bodies.circle(transform.position.x, transform.position.y, 0.1);
      body.plugin = {};
    }

    Matter.Body.scale(body, transform.scale.x, transform.scale.y);

    body.plugin.entity = entity;
    body.slop = this.options.slop;

    rigidbody.setBody(body);

    rigidbody.setVelocity(rigidbody.velocity);
    rigidbody.setAngularVelocity(rigidbody.angularVelocity);
    rigidbody.setDensity(rigidbody.density);
    rigidbody.setRestitution(rigidbody.restitution);
    rigidbody.setFriction(rigidbody.friction);
    rigidbody.setFrictionAir(rigidbody.frictionAir);
    rigidbody.setFrictionStatic(rigidbody.frictionStatic);
    rigidbody.setIsStatic(rigidbody.isStatic);

    if (collider) {
      collider.setBody(body);

      collider.setSensor(collider.isSensor);
    }

    this.bodies.set(entity, body);
    this.bodyScale.set(entity, transform.scale.copy());

    Matter.World.add(this.engine.world, body);
  }

  private createConstraint(entityA: Entity, entityB: Entity) {
    const constraint = entityA.getComponent(Constraint);

    const bodyA = this.bodies.get(entityA)!;
    const bodyB = this.bodies.get(entityB)!;
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

    constraint.setConstraint(c);
    this.constraints.set(entityA, c);

    Matter.World.add(this.engine.world, c);
  }

  private getCollider(entity: Entity): Collider | null {
    if (entity.hasComponent(RectangleCollider)) {
      return entity.getComponent(RectangleCollider);
    } else if (entity.hasComponent(CircleCollider)) {
      return entity.getComponent(CircleCollider);
    } else if (entity.hasComponent(PolygonCollider)) {
      return entity.getComponent(PolygonCollider);
    }

    return null;
  }

  private setupMatterEvents() {
    Matter.Events.on(this.engine, "collisionStart", (event) =>
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_START, event.pairs)
    );

    Matter.Events.on(this.engine, "collisionEnd", (event) =>
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_END, event.pairs)
    );

    Matter.Events.on(this.engine, "collisionActive", (event) =>
      this.onMatterCollisionEvent(ColliderEvent.COLLISION_ACTIVE, event.pairs)
    );
  }

  private onMatterCollisionEvent(type: ColliderEvent, pairs: Matter.Pair[]) {
    for (const pair of pairs) {
      if (!pair.bodyA.plugin || !pair.bodyB.plugin) {
        continue;
      }

      const entityA = (pair.bodyA as TypedBody).plugin!.entity;
      const entityB = (pair.bodyB as TypedBody).plugin!.entity;
      if (!entityA || !entityB) {
        continue;
      }

      const colliderA = this.getCollider(entityA);
      const colliderB = this.getCollider(entityB);

      colliderA?.fire(type, pair, entityA, entityB);
      colliderB?.fire(type, pair, entityB, entityA);
    }
  }
}

import { Vec2 } from "../math/vec";
import { Component } from "@ecs/src/component";
import { type } from "@colyseus/schema";
import Matter from "matter-js";
import { RegistryType } from "@ecs/src/registry";

/**
 * Represents a rigidbody component.
 *
 * @note None of the properties on the rigidbody should be changed directly. Use the setters instead.
 */
export class Rigidbody extends Component {
  @type(Vec2) public velocity: Vec2 = new Vec2();
  @type("float32") public angularVelocity: number = 0;
  @type("float32") public density: number = 0.01;
  @type("float32") public restitution: number = 0;
  @type("float32") public friction: number = 0.1;
  @type("float32") public frictionAir: number = 0.01;
  @type("float32") public frictionStatic: number = 0.5;
  @type("boolean") public isStatic: boolean = false;

  private body: Matter.Body | null = null;

  /**
   * Creates a new rigidbody.
   *
   * @param type The type of the registry owning this component.
   * @param density The density of the rigidbody.
   */
  constructor(type: RegistryType, density = 0.01) {
    super();

    this.setDensity(density);

    // only clients need to update the matter body
    // on state changes, the source of truth is the server
    if (type === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.body) {
          return;
        }

        if (this.density !== this.body.density) {
          Matter.Body.setDensity(this.body, this.density);
        }

        if (this.isStatic !== this.body.isStatic) {
          Matter.Body.setStatic(this.body, this.isStatic);
        }

        this.body.restitution = this.restitution;
        this.body.friction = this.friction;
        this.body.frictionAir = this.frictionAir;
        this.body.frictionStatic = this.frictionStatic;
      });
    }
  }

  /**
   * Applies a force to the rigidbody.
   *
   * @note This will only apply the force if the matter body has been created.
   *
   * @param force The force to apply.
   */
  public applyForce(force: Vec2) {
    if (this.body) {
      Matter.Body.applyForce(this.body, this.body.position, force);
    }
  }

  /**
   * Sets the velocity of the rigidbody.
   *
   * @param velocity The velocity to set.
   */
  public setVelocity(velocity: Vec2) {
    this.velocity = velocity;

    if (this.body) {
      Matter.Body.setVelocity(this.body, velocity);
    }
  }

  /**
   * Sets the angular velocity of the rigidbody.
   *
   * @param angularVelocity The angular velocity to set.
   */
  public setAngularVelocity(angularVelocity: number) {
    this.angularVelocity = angularVelocity;

    if (this.body) {
      Matter.Body.setAngularVelocity(this.body, angularVelocity);
    }
  }

  /**
   * Sets the density of the rigidbody.
   *
   * @param density The density to set.
   */
  public setDensity(density: number) {
    this.density = density;

    if (this.body) {
      Matter.Body.setDensity(this.body, density);
    }
  }

  /**
   * Sets the restitution of the rigidbody.
   *
   * @param restitution The restitution to set.
   */
  public setRestitution(restitution: number) {
    this.restitution = restitution;

    if (this.body) {
      this.body.restitution = restitution;
    }
  }

  /**
   * Sets the friction of the rigidbody.
   *
   * @param friction The friction to set.
   */
  public setFriction(friction: number) {
    this.friction = friction;

    if (this.body) {
      this.body.friction = friction;
    }
  }

  /**
   * Sets the air friction of the rigidbody.
   *
   * @param frictionAir The air friction to set.
   */
  public setFrictionAir(frictionAir: number) {
    this.frictionAir = frictionAir;

    if (this.body) {
      this.body.frictionAir = frictionAir;
    }
  }

  /**
   * Sets the static friction of the rigidbody.
   *
   * @param frictionStatic The static friction to set.
   */
  public setFrictionStatic(frictionStatic: number) {
    this.frictionStatic = frictionStatic;

    if (this.body) {
      this.body.frictionStatic = frictionStatic;
    }
  }

  /**
   * Sets if the rigidbody is static.
   *
   * @param isStatic If the rigidbody is static.
   */
  public setIsStatic(isStatic: boolean) {
    this.isStatic = isStatic;

    if (this.body) {
      Matter.Body.setStatic(this.body, isStatic);
    }
  }

  /**
   * Sets the matter body of the rigidbody.
   *
   * @note This should only be called by the physics world.
   *
   * @param body The body to set.
   */
  public setBody(body: Matter.Body) {
    this.body = body;
  }

  /**
   * Gets the matter body of the rigidbody.
   *
   * @note Only use this if you know what you are doing.
   *
   * @returns The matter body of the rigidbody.
   */
  public getBody() {
    return this.body;
  }

  /**
   * Updates the rigidbody component from the matter body.
   *
   * This will only update properties that may have changed, things like mass are not touched.
   * If you change these properties on the matter body the component will never know about them.
   */
  public update() {
    if (!this.body) {
      return;
    }

    if (this.body.velocity.x !== this.velocity.x) {
      this.velocity.x = this.body.velocity.x;
    }

    if (this.body.velocity.y !== this.velocity.y) {
      this.velocity.y = this.body.velocity.y;
    }

    if (this.body.angularVelocity !== this.angularVelocity) {
      this.angularVelocity = this.body.angularVelocity;
    }
  }
}

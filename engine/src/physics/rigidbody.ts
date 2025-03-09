import { Vec2 } from "../math/vec";
import { Component } from "../ecs/component";
import { type } from "@colyseus/schema";
import Matter from "matter-js";
import { Entity } from "../ecs/entity";
import { TypedBody } from "../matter";

/**
 * Represents a rigidbody component.
 *
 * @note None of the properties on the rigidbody should be changed directly. Use the setters instead.
 */
export class Rigidbody extends Component {
	public static readonly COMPONENT_ID: number = 196;

	public static onComponentAdded(entity: Entity, component: Component) {
		const rigidbody = component as Rigidbody;

		rigidbody.onChange(() => {
			if (!rigidbody.body) {
				return;
			}

			if (rigidbody.density !== rigidbody.body.density) {
				Matter.Body.setDensity(rigidbody.body, rigidbody.density);
			}

			if (rigidbody.isStatic !== rigidbody.body.isStatic) {
				Matter.Body.setStatic(rigidbody.body, rigidbody.isStatic);
			}

			if (rigidbody.inertia !== rigidbody.body.inertia) {
				Matter.Body.setInertia(rigidbody.body, rigidbody.inertia);
			}

			rigidbody.body.restitution = rigidbody.restitution;
			rigidbody.body.friction = rigidbody.friction;
			rigidbody.body.frictionAir = rigidbody.frictionAir;
			rigidbody.body.frictionStatic = rigidbody.frictionStatic;
		});
	}

	@type(Vec2) public velocity: Vec2 = new Vec2();
	@type("float32") public angularVelocity: number = 0;
	@type("float32") public density: number = 0.01;
	@type("float32") public inertia: number = 0.1;
	@type("float32") public restitution: number = 0;
	@type("float32") public friction: number = 0.1;
	@type("float32") public frictionAir: number = 0.01;
	@type("float32") public frictionStatic: number = 0.5;
	@type("boolean") public isStatic: boolean = false;

	/**
	 * The matter body of the rigidbody.
	 *
	 * @warning DO NOT TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING.
	 */
	public body?: TypedBody;

	/**
	 * Creates a new rigidbody.
	 *
	 * @param density The density of the rigidbody.
	 */
	constructor(density = 0.01) {
		super(Rigidbody.COMPONENT_ID);

		Rigidbody.setDensity(this, density);
	}

	/**
	 * Sets the position of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param position The position to set.
	 */
	public static setPosition(rigidbody: Rigidbody, position: Vec2) {
		if (rigidbody.body) {
			Matter.Body.setPosition(rigidbody.body, position);
		}
	}

	/**
	 * Applies a force to the rigidbody.
	 *
	 * @note This will only apply the force if the matter body has been created.
	 *
	 * @param rigidbody The rigidbody.
	 * @param force The force to apply.
	 * @param worldPosition The world position to apply the force at. (default: the center of the rigidbody)
	 */
	public static applyForce(rigidbody: Rigidbody, force: Vec2, worldPosition?: Vec2) {
		if (rigidbody.body) {
			Matter.Body.applyForce(rigidbody.body, worldPosition ?? rigidbody.body.position, force);
		}
	}

	/**
	 * Sets the velocity of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param velocity The velocity to set.
	 */
	public static setVelocity(rigidbody: Rigidbody, velocity: Vec2) {
		rigidbody.velocity.x = velocity.x;
		rigidbody.velocity.y = velocity.y;

		if (rigidbody.body) {
			Matter.Body.setVelocity(rigidbody.body, rigidbody.velocity);
		}
	}

	/**
	 * Sets the angular velocity of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param angularVelocity The angular velocity to set.
	 */
	public static setAngularVelocity(rigidbody: Rigidbody, angularVelocity: number) {
		rigidbody.angularVelocity = angularVelocity;

		if (rigidbody.body) {
			Matter.Body.setAngularVelocity(rigidbody.body, angularVelocity);
		}
	}

	/**
	 * Sets the density of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param density The density to set.
	 */
	public static setDensity(rigidbody: Rigidbody, density: number) {
		rigidbody.density = density;

		if (rigidbody.body) {
			Matter.Body.setDensity(rigidbody.body, density);
		}
	}

	/**
	 * Sets the restitution of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param restitution The restitution to set.
	 */
	public static setRestitution(rigidbody: Rigidbody, restitution: number) {
		rigidbody.restitution = restitution;

		if (rigidbody.body) {
			rigidbody.body.restitution = restitution;
		}
	}

	/**
	 * Sets the inertia of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param inertia The inertia to set.
	 */
	public static setInertia(rigidbody: Rigidbody, inertia: number) {
		rigidbody.inertia = inertia;

		if (rigidbody.body) {
			Matter.Body.setInertia(rigidbody.body, inertia);
		}
	}

	/**
	 * Sets the friction of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param friction The friction to set.
	 */
	public static setFriction(rigidbody: Rigidbody, friction: number) {
		rigidbody.friction = friction;

		if (rigidbody.body) {
			rigidbody.body.friction = friction;
		}
	}

	/**
	 * Sets the air friction of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param frictionAir The air friction to set.
	 */
	public static setFrictionAir(rigidbody: Rigidbody, frictionAir: number) {
		rigidbody.frictionAir = frictionAir;

		if (rigidbody.body) {
			rigidbody.body.frictionAir = frictionAir;
		}
	}

	/**
	 * Sets the static friction of the rigidbody.
	 *
	 * @param rigidbody The rigidbody.
	 * @param frictionStatic The static friction to set.
	 */
	public static setFrictionStatic(rigidbody: Rigidbody, frictionStatic: number) {
		rigidbody.frictionStatic = frictionStatic;

		if (rigidbody.body) {
			rigidbody.body.frictionStatic = frictionStatic;
		}
	}

	/**
	 * Sets if the rigidbody is static.
	 *
	 * @param rigidbody The rigidbody.
	 * @param isStatic If the rigidbody is static.
	 */
	public static setIsStatic(rigidbody: Rigidbody, isStatic: boolean) {
		rigidbody.isStatic = isStatic;

		if (rigidbody.body) {
			Matter.Body.setStatic(rigidbody.body, isStatic);
		}
	}

	/**
	 * Sets the matter body of the rigidbody.
	 *
	 * @note This should only be called by the physics world.
	 *
	 * @param rigidbody The rigidbody.
	 * @param body The body to set.
	 */
	public static setBody(rigidbody: Rigidbody, body: TypedBody | undefined) {
		rigidbody.body = body;
	}

	/**
	 * Gets the matter body of the rigidbody.
	 *
	 * @note Only use this if you know what you are doing.
	 *
	 * @param rigidbody The rigidbody.
	 *
	 * @returns The matter body of the rigidbody.
	 */
	public static getBody(rigidbody: Rigidbody) {
		return rigidbody.body;
	}

	/**
	 * Updates the rigidbody component from the matter body.
	 *
	 * This will only update properties that may have changed, things like mass are not touched.
	 * If you change these properties on the matter body the component will never know about them.
	 *
	 * @param rigidbody The rigidbody to update.
	 */
	public static update(rigidbody: Rigidbody) {
		if (!rigidbody.body) {
			return;
		}

		rigidbody.velocity.x = rigidbody.body.velocity.x;
		rigidbody.velocity.y = rigidbody.body.velocity.y;
		rigidbody.angularVelocity = rigidbody.body.angularVelocity;
	}
}

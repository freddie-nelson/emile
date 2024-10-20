import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";
import { RegistryType } from "../ecs/registry";
import Matter from "matter-js";
import { Vec2 } from "../math/vec";

export class Constraint extends Component {
  @type("string") public readonly entityBId: string;
  @type("float32") public length: number = -1;
  @type("float32") public stiffness: number = 1;
  @type("float32") public damping: number = 0;
  @type(Vec2) public pointA: Vec2 = new Vec2();
  @type(Vec2) public pointB: Vec2 = new Vec2();

  /**
   * The matter constraint of the component.
   *
   * @warning DO NOT TOUCH THIS UNLESS YOU KNOW WHAT YOU ARE DOING.
   */
  public constraint: Matter.Constraint | null = null;

  /**
   * Creates a new constraint.
   *
   * @note If entity B is not a valid physics entity, the constraint will not be created.
   * @note If entity B is destroyed, the constraint will be destroyed as well.
   *
   * @param registryType The type of the registry owning this component.
   * @param entityBId The id of the entity to attach the owning entity to.
   */
  constructor(registryType: RegistryType, entityBId: string) {
    super();

    this.entityBId = entityBId;

    if (registryType === RegistryType.CLIENT) {
      this.onChange(() => {
        if (!this.constraint) {
          return;
        }

        // if we get a state update from the server where length is -1
        // don't update as we can wait for the next update to get the correct length
        if (this.length !== -1) {
          this.constraint.length = this.length;
        }

        this.constraint.stiffness = this.stiffness;
        this.constraint.damping = this.damping;
        this.constraint.pointA = this.pointA;
        this.constraint.pointB = this.pointB;
      });
    }
  }

  /**
   * Sets the length of the constraint.
   *
   * Setting this to -1 will cause the constraint to be recreated with the length of the current distance between the two entities.
   *
   * @param length The length to set.
   */
  public setLength(length: number): void {
    this.length = length;

    if (this.length === -1) {
      this.constraint = null;
    } else if (this.constraint) {
      this.constraint.length = length;
    }
  }

  /**
   * Sets the stiffness of the constraint.
   *
   * @param stiffness The stiffness to set.
   */
  public setStiffness(stiffness: number): void {
    this.stiffness = stiffness;

    if (this.constraint) {
      this.constraint.stiffness = stiffness;
    }
  }

  /**
   * Sets the damping of the constraint.
   *
   * @param damping The damping to set.
   */
  public setDamping(damping: number): void {
    this.damping = damping;

    if (this.constraint) {
      this.constraint.damping = damping;
    }
  }

  /**
   * Sets the point A of the constraint.
   *
   * This is the offset from the center of A to attach the constraint to. (in local space)
   *
   * @param pointA The point A to set.
   */
  public setPointA(pointA: Vec2): void {
    this.pointA = pointA;

    if (this.constraint) {
      this.constraint.pointA = pointA;
    }
  }

  /**
   * Sets the point B of the constraint.
   *
   * This is the offset from the center of B to attach the constraint to. (in local space)
   *
   * @param pointB The point B to set.
   */
  public setPointB(pointB: Vec2): void {
    this.pointB = pointB;

    if (this.constraint) {
      this.constraint.pointB = pointB;
    }
  }

  /**
   * Sets the matter constraint of the component.
   *
   * @note This should only be called by the physics world.
   *
   * @param constraint The matter constraint to set.
   */
  public setConstraint(constraint: Matter.Constraint): void {
    this.constraint = constraint;
  }

  /**
   * Gets the matter constraint of the component.
   *
   * @note Only use this if you know what you are doing.
   *
   * @returns The matter constraint.
   */
  public getConstraint(): Matter.Constraint | null {
    return this.constraint;
  }
}

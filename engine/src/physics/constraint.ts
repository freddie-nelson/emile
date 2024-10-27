import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";
import Matter from "matter-js";
import { Vec2 } from "../math/vec";
import { Entity } from "../ecs/entity";

export class Constraint extends Component {
  public static readonly COMPONENT_ID: number = 195;

  public static onComponentAdded(entity: Entity, component: Component) {
    const constraint = component as Constraint;

    constraint.onChange(() => {
      if (!constraint.constraint) {
        return;
      }

      // if we get a state update from the server where length is -1
      // don't update as we can wait for the next update to get the correct length
      if (constraint.length !== -1) {
        constraint.constraint.length = constraint.length;
      }

      constraint.constraint.stiffness = constraint.stiffness;
      constraint.constraint.damping = constraint.damping;
      constraint.constraint.pointA = constraint.pointA;
      constraint.constraint.pointB = constraint.pointB;
    });
  }

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
  public constraint?: Matter.Constraint;

  /**
   * Creates a new constraint.
   *
   * @note If entity B is not a valid physics entity, the constraint will not be created.
   * @note If entity B is destroyed, the constraint will be destroyed as well.
   *
   * @param entityBId The id of the entity to attach the owning entity to.
   */
  constructor(entityBId: string) {
    super(Constraint.COMPONENT_ID);

    this.entityBId = entityBId;
  }

  /**
   * Sets the length of the constraint.
   *
   * Setting this to -1 will cause the constraint to be recreated with the length of the current distance between the two entities.
   *
   * @param constraint The constraint.
   * @param length The length to set.
   */
  public static setLength(constraint: Constraint, length: number): void {
    constraint.length = length;

    if (this.length === -1) {
      constraint.constraint = undefined;
    } else if (constraint.constraint) {
      constraint.constraint.length = length;
    }
  }

  /**
   * Sets the stiffness of the constraint.
   *
   * @param constraint The constraint.
   * @param stiffness The stiffness to set.
   */
  public static setStiffness(constraint: Constraint, stiffness: number): void {
    constraint.stiffness = stiffness;

    if (constraint.constraint) {
      constraint.constraint.stiffness = stiffness;
    }
  }

  /**
   * Sets the damping of the constraint.
   *
   * @param constraint The constraint.
   * @param damping The damping to set.
   */
  public static setDamping(constraint: Constraint, damping: number): void {
    constraint.damping = damping;

    if (constraint.constraint) {
      constraint.constraint.damping = damping;
    }
  }

  /**
   * Sets the point A of the constraint.
   *
   * This is the offset from the center of A to attach the constraint to. (in local space)
   *
   * @param constraint The constraint.
   * @param pointA The point A to set.
   */
  public static setPointA(constraint: Constraint, pointA: Vec2): void {
    constraint.pointA = pointA;

    if (constraint.constraint) {
      constraint.constraint.pointA = pointA;
    }
  }

  /**
   * Sets the point B of the constraint.
   *
   * This is the offset from the center of B to attach the constraint to. (in local space)
   *
   * @param constraint The constraint.
   * @param pointB The point B to set.
   */
  public static setPointB(constraint: Constraint, pointB: Vec2): void {
    constraint.pointB = pointB;

    if (constraint.constraint) {
      constraint.constraint.pointB = pointB;
    }
  }

  /**
   * Sets the matter constraint of the component.
   *
   * @note This should only be called by the physics world.
   *
   * @param constraint The constraint.
   * @param matterConstraint The matter constraint to set.
   */
  public static setConstraint(constraint: Constraint, matterConstraint: Matter.Constraint): void {
    constraint.constraint = matterConstraint;
  }

  /**
   * Gets the matter constraint of the component.
   *
   * @note Only use this if you know what you are doing.
   *
   * @returns The matter constraint.
   */
  public static getConstraint(constraint: Constraint): Matter.Constraint | undefined {
    return constraint.constraint;
  }
}

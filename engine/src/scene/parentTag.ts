import { type } from "@colyseus/schema";
import { Component } from "../ecs/component";

/**
 * A tag that relates this entity to a parent entity.
 *
 * The entity with the `ParentTag` component is the child, and the `parentEntityId` is the parent entity.
 */
export class ParentTag extends Component {
  public static readonly COMPONENT_ID: number = 201;

  @type("string") parentEntityId: string = "";

  /**
   * Creates a new `ParentTag` component.
   *
   * @param parentEntityId The parent entity's ID.
   */
  constructor(parentEntityId: string = "") {
    super(ParentTag.COMPONENT_ID);
    this.parentEntityId = parentEntityId;
  }
}

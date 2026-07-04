import { Component } from "../ecs/component";

/**
 * EditorMetadataTag is a component that holds metadata information for an entity for the purpose of the editor.
 *
 * Its properties are not synced across the network.
 */
export class EditorMetadataTag extends Component {
  public static readonly COMPONENT_ID: number = 204;

  name: string = "";

  constructor(name: string) {
    super(EditorMetadataTag.COMPONENT_ID);
    this.name = name;
  }
}

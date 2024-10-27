import { Component } from "../ecs/component";

export class Renderable extends Component {
  public static readonly COMPONENT_ID: number = 197;

  constructor() {
    super(Renderable.COMPONENT_ID);
  }
}

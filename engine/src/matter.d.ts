import { Entity } from "./ecs/entity";

export interface TypedBody extends Matter.Body {
  plugin: {
    circleRadius?: number;
    rectangleWidth?: number;
    rectangleHeight?: number;
    polygonVertices?: Vec2[];
    entity?: Entity;
  } | null;
}

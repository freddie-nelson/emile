import { Entity } from "./ecs/entity";
import { Vec2 } from "./math/vec";
import { ColliderType } from "./physics/collider";

export interface TypedBody extends Matter.Body {
  plugin: {
    circleRadius?: number;
    rectangleWidth?: number;
    rectangleHeight?: number;
    polygonVertices?: Vec2[];
    entity?: string;
    colliderType?: ColliderType;
    bodyScale?: Vec2;
  } | null;
}

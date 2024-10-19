export interface TypedBody extends Matter.Body {
  plugin?: {
    circleRadius?: number;
    rectangleWidth?: number;
    rectangleHeight?: number;
    polygonVertices?: Vec2[];
  };
}

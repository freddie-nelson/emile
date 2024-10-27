import { Schema, type } from "@colyseus/schema";

export class Vec2 extends Schema {
  @type("float64") public x: number;
  @type("float64") public y: number;

  /**
   * Creates a new Vec2 instance.
   *
   * The x and y values will be set to 0.
   */
  constructor();

  /**
   * Creates a new Vec2 instance.
   *
   * @param xy The x and y values.
   */
  constructor(xy: number);

  /**
   * Creates a new Vec2 instance.
   *
   * @param x The x value.
   * @param y The y value.
   */
  constructor(x: number, y: number);

  constructor(x?: number, y?: number) {
    super();

    if (x === undefined) {
      this.x = 0;
      this.y = 0;
    } else if (y === undefined) {
      this.x = x;
      this.y = x;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  public static set(v: Vec2, x: number, y: number): void {
    v.x = x;
    v.y = y;
  }

  public static add(v: Vec2, vec: Vec2): Vec2 {
    return new Vec2(v.x + vec.x, v.y + vec.y);
  }

  public static sub(v: Vec2, vec: Vec2): Vec2 {
    return new Vec2(v.x - vec.x, v.y - vec.y);
  }

  public static mul(v: Vec2, scalar: number): Vec2 {
    return new Vec2(v.x * scalar, v.y * scalar);
  }

  public static div(v: Vec2, scalar: number): Vec2;
  public static div(v: Vec2, vec: Vec2): Vec2;

  public static div(v: Vec2, vec: Vec2 | number): Vec2 {
    if (typeof vec === "number") {
      return new Vec2(v.x / vec, v.y / vec);
    }

    return new Vec2(v.x / vec.x, v.y / vec.y);
  }

  public static dot(v: Vec2, vec: Vec2): number {
    return v.x * vec.x + v.y * vec.y;
  }

  public static len(v: Vec2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }

  public static sqrLen(v: Vec2): number {
    return v.x * v.x + v.y * v.y;
  }

  public static normalize(v: Vec2): Vec2 {
    const len = Vec2.len(v);
    return new Vec2(v.x / len, v.y / len);
  }

  public static angle(v: Vec2): number {
    return Math.atan2(v.y, v.x);
  }

  public static rotate(v: Vec2, angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(v.x * cos - v.y * sin, v.x * sin + v.y * cos);
  }

  public static distance(v: Vec2, vec: Vec2): number {
    return Vec2.len(Vec2.sub(v, vec));
  }

  public static sqrDistance(v: Vec2, vec: Vec2): number {
    return Vec2.sqrLen(Vec2.sub(v, vec));
  }

  public static min(v: Vec2, vec: Vec2): Vec2 {
    return new Vec2(Math.min(v.x, vec.x), Math.min(v.y, vec.y));
  }

  public static max(v: Vec2, vec: Vec2): Vec2 {
    return new Vec2(Math.max(v.x, vec.x), Math.max(v.y, vec.y));
  }

  public static clamp(v: Vec2, min: Vec2, max: Vec2): Vec2 {
    return Vec2.min(Vec2.max(v, min), max);
  }

  public static copy(v: Vec2): Vec2 {
    return new Vec2(v.x, v.y);
  }

  public static equals(v: Vec2, vec: Vec2): boolean {
    return v.x === vec.x && v.y === vec.y;
  }

  public static toString(v: Vec2) {
    return `(${v.x}, ${v.y})`;
  }
}

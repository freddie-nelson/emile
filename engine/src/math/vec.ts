import { Schema, type } from "@colyseus/schema";

export class Vec2 extends Schema {
  @type("float64") public x: number;
  @type("float64") public y: number;

  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public setX(x: number): void {
    this.x = x;
  }

  public setY(y: number): void {
    this.y = y;
  }

  public set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public add(vec: Vec2): Vec2 {
    return new Vec2(this.x + vec.x, this.y + vec.y);
  }

  public sub(vec: Vec2): Vec2 {
    return new Vec2(this.x - vec.x, this.y - vec.y);
  }

  public mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  public div(scalar: number): Vec2;
  public div(vec: Vec2): Vec2;

  public div(vec: Vec2 | number): Vec2 {
    if (typeof vec === "number") {
      return new Vec2(this.x / vec, this.y / vec);
    }

    return new Vec2(this.x / vec.x, this.y / vec.y);
  }

  public dot(vec: Vec2): number {
    return this.x * vec.x + this.y * vec.y;
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public sqrLength(): number {
    return this.x * this.x + this.y * this.y;
  }

  public normalize(): Vec2 {
    const len = this.length();
    return new Vec2(this.x / len, this.y / len);
  }

  public angle(): number {
    return Math.atan2(this.y, this.x);
  }

  public rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  public distance(vec: Vec2): number {
    return this.sub(vec).length();
  }

  public sqrDistance(vec: Vec2): number {
    return this.sub(vec).sqrLength();
  }

  public min(vec: Vec2): Vec2 {
    return new Vec2(Math.min(this.x, vec.x), Math.min(this.y, vec.y));
  }

  public max(vec: Vec2): Vec2 {
    return new Vec2(Math.max(this.x, vec.x), Math.max(this.y, vec.y));
  }

  public clamp(min: Vec2, max: Vec2): Vec2 {
    return this.max(min).min(max);
  }

  public copy(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  public equals(vec: Vec2): boolean {
    return this.x === vec.x && this.y === vec.y;
  }

  public toString() {
    return `(${this.x}, ${this.y})`;
  }
}

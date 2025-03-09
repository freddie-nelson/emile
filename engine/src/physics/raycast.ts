import Matter from "matter-js";
import { TypedBody } from "../matter";
import { Entity } from "../ecs/entity";
import { Vec2 } from "../math/vec";

/**
 * Performs a raycast and returns an array of raycol objects.
 * @param {TypedBody[]} bodies - Bodies to check collision with; passed through Matter.Query.ray().
 * @param {vec2} start - Start point of raycast.
 * @param {vec2} end - End point of raycast.
 * @param {boolean} [sort=true] - Whether or not the ray collisions should be sorted based on distance from the origin.
 * @returns {RayCol[]} Array of raycol objects containing collision information.
 */
export default function raycast(
  bodies: TypedBody[],
  s: Matter.Vector,
  e: Matter.Vector,
  sort: boolean = true
): RayCol[] {
  const start = vec2.fromOther(s);
  const end = vec2.fromOther(e);

  const query = Matter.Query.ray(bodies, start.toPhysVector(), end.toPhysVector());
  const cols: RayCol[] = [];
  const raytest = new ray(start, end);

  for (let i = query.length - 1; i >= 0; i--) {
    const bcols = ray.bodyCollisions(raytest, query[i].bodyA);

    for (let k = bcols.length - 1; k >= 0; k--) {
      if (!bcols[k].entity) {
        continue;
      }

      cols.push(bcols[k]);
    }
  }

  if (sort) {
    const startVec = new Vec2(start.x, start.y);
    cols.sort((a, b) => Vec2.sqrDistance(a.point, startVec) - Vec2.sqrDistance(b.point, startVec));
  }

  return cols;
}

/**
 * Data type that contains information about an intersection between a ray and a body.
 */
export class RayCol {
  body: TypedBody;
  point: Vec2;
  normal: Vec2;
  verts: Vec2[];
  entity: string;

  /**
   * Initializes a raycol object with the given data.
   * @param {TypedBody} body - The body that the ray has collided with.
   * @param {vec2} point - The collision point.
   * @param {vec2} normal - The normal of the edge that the ray collides with.
   * @param {vec2[]} verts - The vertices of the edge that the ray collides with.
   */
  constructor(body: TypedBody, point: vec2, normal: vec2, verts: vec2[]) {
    this.body = body;
    this.point = new Vec2(point.x, point.y);
    this.normal = new Vec2(normal.x, normal.y);
    this.verts = verts.map((v) => new Vec2(v.x, v.y));
    this.entity = body.plugin?.entity ?? "";
  }
}

/**
 * Data type that contains information and methods for a ray object.
 */
class ray {
  start: vec2;
  end: vec2;
  verts?: vec2[];

  /**
   * Initializes a ray instance with the given parameters.
   * @param {vec2} start - The starting point of the ray.
   * @param {vec2} end - The ending point of the ray.
   */
  constructor(start: vec2, end: vec2) {
    this.start = start;
    this.end = end;
  }

  /**
   * Returns the y value on the ray at the specified x.
   * @param {number} x - The x value.
   * @returns {number} The y value.
   */
  yValueAt(x: number): number {
    return this.offsetY + this.slope * x;
  }

  /**
   * Returns the x value on the ray at the specified y.
   * @param {number} y - The y value.
   * @returns {number} The x value.
   */
  xValueAt(y: number): number {
    return (y - this.offsetY) / this.slope;
  }

  /**
   * Checks to see if the specified point is within the ray's bounding box (inclusive).
   * @param {vec2} point - The point to check.
   * @returns {boolean} True if the point is within bounds, false otherwise.
   */
  pointInBounds(point: vec2): boolean {
    const minX = Math.min(this.start.x, this.end.x);
    const maxX = Math.max(this.start.x, this.end.x);
    const minY = Math.min(this.start.y, this.end.y);
    const maxY = Math.max(this.start.y, this.end.y);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  }

  /**
   * Calculates the normal based on a specified reference point.
   * @param {vec2} ref - The reference point.
   * @returns {vec2} The normal vector.
   */
  calculateNormal(ref: vec2): vec2 {
    const dif = this.difference;
    const norm1 = dif.normalized().rotate(Math.PI / 2);
    const norm2 = dif.normalized().rotate(Math.PI / -2);
    if (this.start.plus(norm1).distance(ref) < this.start.plus(norm2).distance(ref)) return norm1;
    return norm2;
  }

  /**
   * Returns the difference vector between the start and end points.
   * @returns {vec2} The difference vector.
   */
  get difference(): vec2 {
    return this.end.minus(this.start);
  }

  /**
   * Returns the slope of the ray.
   * @returns {number} The slope.
   */
  get slope(): number {
    const dif = this.difference;
    return dif.y / dif.x;
  }

  /**
   * Returns the y-offset at x = 0, in slope-intercept form.
   * @returns {number} The y-offset.
   */
  get offsetY(): number {
    return this.start.y - this.slope * this.start.x;
  }

  /**
   * Checks if the ray is horizontal.
   * @returns {boolean} True if the ray is horizontal, false otherwise.
   */
  get isHorizontal(): boolean {
    return compareNum(this.start.y, this.end.y);
  }

  /**
   * Checks if the ray is vertical.
   * @returns {boolean} True if the ray is vertical, false otherwise.
   */
  get isVertical(): boolean {
    return compareNum(this.start.x, this.end.x);
  }

  /**
   * Returns the intersection point between two rays, or null if no intersection.
   * @param {ray} rayA - The first ray.
   * @param {ray} rayB - The second ray.
   * @returns {vec2 | null} The intersection point, or null if no intersection.
   */
  static intersect(rayA: ray, rayB: ray): vec2 | null {
    if (rayA.isVertical && rayB.isVertical) return null;
    if (rayA.isVertical) return new vec2(rayA.start.x, rayB.yValueAt(rayA.start.x));
    if (rayB.isVertical) return new vec2(rayB.start.x, rayA.yValueAt(rayB.start.x));
    if (compareNum(rayA.slope, rayB.slope)) return null;
    if (rayA.isHorizontal) return new vec2(rayB.xValueAt(rayA.start.y), rayA.start.y);
    if (rayB.isHorizontal) return new vec2(rayA.xValueAt(rayB.start.y), rayB.start.y);
    const x = (rayB.offsetY - rayA.offsetY) / (rayA.slope - rayB.slope);
    return new vec2(x, rayA.yValueAt(x));
  }

  /**
   * Returns the collision point of two rays, or null if no collision.
   * @param {ray} rayA - The first ray.
   * @param {ray} rayB - The second ray.
   * @returns {vec2 | null} The collision point, or null if no collision.
   */
  static collisionPoint(rayA: ray, rayB: ray): vec2 | null {
    const intersection = ray.intersect(rayA, rayB);
    if (!intersection) return null;
    if (!rayA.pointInBounds(intersection)) return null;
    if (!rayB.pointInBounds(intersection)) return null;
    return intersection;
  }

  /**
   * Returns all of the edges of a body in the form of an array of ray objects.
   * @param {TypedBody} body - The body to get edges from.
   * @returns {ray[]} Array of ray objects representing the edges.
   */
  static bodyEdges(body: TypedBody): ray[] {
    const r: ray[] = [];
    for (let i = body.parts.length - 1; i >= 0; i--) {
      for (let k = body.parts[i].vertices.length - 1; k >= 0; k--) {
        let k2 = k + 1;
        if (k2 >= body.parts[i].vertices.length) k2 = 0;
        const tray = new ray(
          vec2.fromOther(body.parts[i].vertices[k]),
          vec2.fromOther(body.parts[i].vertices[k2])
        );
        tray.verts = [
          new vec2(body.parts[i].vertices[k].x, body.parts[i].vertices[k].y),
          new vec2(body.parts[i].vertices[k2].x, body.parts[i].vertices[k2].y),
        ];
        r.push(tray);
      }
    }
    return r;
  }

  /**
   * Returns all the collisions between a specified ray and body in the form of an array of raycol objects.
   * @param {ray} rayA - The ray to test for collisions.
   * @param {TypedBody} body - The body to test for collisions.
   * @returns {RayCol[]} Array of raycol objects representing the collisions.
   */
  static bodyCollisions(rayA: ray, body: TypedBody): RayCol[] {
    const r: RayCol[] = [];
    const edges = ray.bodyEdges(body);
    for (let i = edges.length - 1; i >= 0; i--) {
      const colpoint = ray.collisionPoint(rayA, edges[i]);
      if (!colpoint) continue;
      const normal = edges[i].calculateNormal(rayA.start);
      r.push(new RayCol(body, colpoint, normal, edges[i].verts!));
    }
    return r;
  }
}

/**
 * Compares two numbers with a specified leniency to avoid floating point errors.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @param {number} [leniency=0.00001] - The leniency for comparison.
 * @returns {boolean} True if the numbers are equal within the leniency, false otherwise.
 */
function compareNum(a: number, b: number, leniency: number = 0.00001): boolean {
  return Math.abs(b - a) <= leniency;
}

/**
 * 2D vector data type; contains information and methods for 2-dimensional vectors.
 */
class vec2 {
  x: number;
  y: number;

  /**
   * Initializes a vec2 object with specified values.
   * @param {number} [x=0] - The x value.
   * @param {number} [y=x] - The y value.
   */
  constructor(x: number = 0, y: number = x) {
    this.x = x;
    this.y = y;
  }

  /**
   * Returns a vector with the same direction as this but with a specified magnitude.
   * @param {number} [magnitude=1] - The magnitude of the vector.
   * @returns {vec2} The normalized vector.
   */
  normalized(magnitude: number = 1): vec2 {
    return this.multiply(magnitude / this.distance());
  }

  /**
   * Returns the opposite of this vector.
   * @returns {vec2} The inverted vector.
   */
  get inverted(): vec2 {
    return this.multiply(-1);
  }

  /**
   * Returns this vector multiplied by a specified factor.
   * @param {number} factor - The factor to multiply by.
   * @returns {vec2} The resulting vector.
   */
  multiply(factor: number): vec2 {
    return new vec2(this.x * factor, this.y * factor);
  }

  /**
   * Returns the result of this vector added to another specified vec2 object.
   * @param {vec2} vec - The vector to add.
   * @returns {vec2} The resulting vector.
   */
  plus(vec: vec2): vec2 {
    return new vec2(this.x + vec.x, this.y + vec.y);
  }

  /**
   * Returns the result of this vector subtracted by another specified vec2 object.
   * @param {vec2} vec - The vector to subtract.
   * @returns {vec2} The resulting vector.
   */
  minus(vec: vec2): vec2 {
    return this.plus(vec.inverted);
  }

  /**
   * Rotates the vector by the specified angle.
   * @param {number} rot - The angle to rotate by.
   * @returns {vec2} The rotated vector.
   */
  rotate(rot: number): vec2 {
    const ang = this.direction;
    const mag = this.distance();
    return vec2.fromAng(ang + rot, mag);
  }

  /**
   * Converts this vector to a vector compatible with the Matter.js physics engine.
   * @returns {Matter.Vector} The Matter.js vector.
   */
  toPhysVector(): Matter.Vector {
    return Matter.Vector.create(this.x, this.y);
  }

  /**
   * Returns the angle this vector is pointing in radians.
   * @returns {number} The direction angle.
   */
  get direction(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Returns the distance between this vector and a specified vec2 object.
   * @param {vec2} [vec=new vec2()] - The vector to measure distance to.
   * @returns {number} The distance.
   */
  distance(vec: vec2 = new vec2()): number {
    return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2));
  }

  /**
   * Returns a new instance of a vec2 object with the same value.
   * @returns {vec2} The cloned vector.
   */
  clone(): vec2 {
    return new vec2(this.x, this.y);
  }

  /**
   * Returns a vector which points in the specified angle and has the specified magnitude.
   * @param {number} angle - The angle to point in.
   * @param {number} [magnitude=1] - The magnitude of the vector.
   * @returns {vec2} The resulting vector.
   */
  static fromAng(angle: number, magnitude: number = 1): vec2 {
    return new vec2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }

  /**
   * Converts other data types that contain x and y properties to a vec2 object type.
   * @param {any} vector - The vector to convert.
   * @returns {vec2} The resulting vec2 object.
   */
  static fromOther(vector: any): vec2 {
    return new vec2(vector.x, vector.y);
  }

  /**
   * Returns a string representation of the vector.
   * @returns {string} The string representation.
   */
  toString(): string {
    return `vector<${this.x}, ${this.y}>`;
  }
}

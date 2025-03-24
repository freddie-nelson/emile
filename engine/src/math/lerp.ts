import { WorldTransform } from "../scene/sceneGraph";
import { limitRadiansRange } from "./angle";
import { Vec2 } from "./vec";

/**
 * Linearly interpolates between two values.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t The interpolation parameter.
 *
 * @returns The interpolated value.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linearly interpolates between rotation angles.
 *
 * This function ensures that the interpolation is always done in the shortest direction.
 *
 * The angles are expected to be in radians.
 *
 * @param a The start rotation angle.
 * @param b The end rotation angle.
 * @param t The interpolation parameter.
 *
 * @returns The interpolated rotation angle.
 */
export function lerpAngle(a: number, b: number, t: number): number {
  if (!a) {
    a = Math.PI * 2;
  }
  if (!b) {
    b = Math.PI * 2;
  }

  const diff = b - a;
  if (diff > Math.PI) {
    b -= Math.PI * 2;
  } else if (diff < -Math.PI) {
    b += Math.PI * 2;
  }

  return a + (b - a) * t;
}

/**
 * Linearly interpolates between two transforms.
 *
 * @note Algorithm taken from [W3 CSS Transforms - Interpolation of decomposed 2D matrix values](https://www.w3.org/TR/css-transforms-1/#interpolation-of-decomposed-2d-matrix-values)
 *
 * @param a The start transform.
 * @param b The end transform.
 * @param t The interpolation parameter.
 * @param useAZIndex Whether to use the z-index of a or b. If false uses `b.zIndex` else uses `a.zIndex`. (default false)
 *
 * @returns The interpolated transform.
 */
export function lerpTransform(
  a: WorldTransform,
  b: WorldTransform,
  t: number,
  useAZIndex = false
): WorldTransform {
  let aRot = limitRadiansRange(a.rotation);
  let bRot = limitRadiansRange(b.rotation);

  // If x-axis of one is flipped, and y-axis of the other,
  // convert to an unflipped rotation.
  if ((a.scale.x < 0 && b.scale.y < 0) || (a.scale.y < 0 && b.scale.x < 0)) {
    a.scale.x = -a.scale.x;
    a.scale.y = -a.scale.y;
    aRot += aRot < 0 ? Math.PI : -Math.PI;
  }

  // Don’t rotate the long way around.
  if (!aRot) {
    aRot = Math.PI * 2;
  }
  if (!bRot) {
    bRot = Math.PI * 2;
  }

  if (Math.abs(aRot - bRot) > Math.PI) {
    if (aRot > bRot) {
      aRot -= Math.PI * 2;
    } else {
      bRot -= Math.PI * 2;
    }
  }

  return {
    position: Vec2.lerp(a.position, b.position, t),
    rotation: lerp(aRot, bRot, t), // already fixed shortest angle lerp above
    scale: Vec2.lerp(a.scale, b.scale, t),
    zIndex: useAZIndex ? a.zIndex : b.zIndex,
  };
}

const MASK1 = 0xff00ff;
const MASK2 = 0x00ff00;
export function lerpColor(a: number, b: number, t: number): number {
  const f2 = 256 * t;
  const f1 = 256 - f2;

  return (
    ((((a & MASK1) * f1 + (b & MASK1) * f2) >> 8) & MASK1) |
    ((((a & MASK2) * f1 + (b & MASK2) * f2) >> 8) & MASK2)
  );
}

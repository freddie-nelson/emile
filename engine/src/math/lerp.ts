import { WorldTransform } from "../scene/sceneGraph";
import { limitRadiansRange } from "./angle";
import { Vec2 } from "./vec";
import { hexToRgb, rgbToHex } from "../rendering/helpers/color";
import { Logger } from "@shared/src/Logger";
import Engine, { UpdateCallbackType } from "../engine";
import { clamp } from "./clamp";

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
  a = limitRadiansRange(a);
  b = limitRadiansRange(b);

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

export function lerpArray(a: number[], b: number[], t: number, transform?: (n: number) => number): number[] {
  if (a.length !== b.length) {
    Logger.errorAndThrow("LERP", "lerpArray: a and b must be the same length");
    throw new Error("Unreachable code");
  }

  return a.map((value, index) => {
    return transform ? transform(lerp(value, b[index], t)) : lerp(value, b[index], t);
  });
}

export function lerpColor(a: number, b: number, t: number): number {
  const aRgb = hexToRgb(a);
  const bRgb = hexToRgb(b);
  const newRgb = lerpArray(aRgb, bRgb, t, (n) => Math.round(n));

  return rgbToHex(newRgb[0], newRgb[1], newRgb[2]);
}

/**
 * Lerps between 2 values over engine updates/ticks.
 *
 * @param engine The engine to attach the update callback to.
 * @param a The start value.
 * @param b The end value.
 * @param duration The duration of the lerp in seconds.
 * @param cb The callback to call with the lerped value.
 */
export function lerpOverTime(
  engine: Engine,
  a: number,
  b: number,
  duration: number,
  cb: (n: number) => void
) {
  let time = 0;

  const update = (dt: number) => {
    time += dt;
    cb(lerp(a, b, clamp(time / duration, 0, 1)));

    if (time >= duration) {
      engine.off(UpdateCallbackType.POST_UPDATE, update);
    }
  };

  engine.on(UpdateCallbackType.POST_UPDATE, update);
}

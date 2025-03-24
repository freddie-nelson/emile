import { mat4 } from "gl-matrix";
import { createWorldTransform, WorldTransform } from "../scene/sceneGraph";
import { Vec2 } from "./vec";

/**
 * Converts the given matrix to a transform.
 *
 * Assumes the given matrix is a 2D transformation matrix, as defined by the W3C CSS Transforms specification. (this is the default from the scene graph)
 *
 * @note Algorithm taken from [W3 CSS Transforms - Decompsing a 2D Matrix](https://www.w3.org/TR/css-transforms-1/#decomposing-a-2d-matrix)
 *
 * @param matrix The matrix to convert to a transform.
 *
 * @returns The transform represented by the matrix.
 */
export function decomposeMat2d(matrix: mat4): WorldTransform {
  const translate = new Vec2();
  const scale = new Vec2();

  let row0x = matrix[0];
  let row0y = matrix[1];
  let row1x = matrix[4];
  let row1y = matrix[5];

  translate.x = matrix[12];
  translate.y = matrix[13];

  scale.x = Math.sqrt(row0x * row0x + row0y * row0y);
  scale.y = Math.sqrt(row1x * row1x + row1y * row1y);

  // If determinant is negative, one axis was flipped.
  const determinant = row0x * row1y - row0y * row1x;
  if (determinant < 0) {
    // Flip axis with minimum unit vector dot product.
    if (row0x < row1y) {
      scale.x = -scale.x;
    } else {
      scale.y = -scale.y;
    }
  }

  // Renormalize matrix to remove scale.
  if (scale.x) {
    row0x *= 1 / scale.x;
    row0y *= 1 / scale.x;
  }
  if (scale.y) {
    row1x *= 1 / scale.y;
    row1y *= 1 / scale.y;
  }

  // Compute rotation and renormalize matrix.
  const angle = Math.atan2(row0y, row0x);

  if (angle) {
    // Rotate(-angle) = [cos(angle), sin(angle), -sin(angle), cos(angle)]
    //                = [row0x, -row0y, row0y, row0x]
    // Thanks to the normalization above.
    const sn = -row0y;
    const cs = row0x;
    const m11 = row0x;
    const m12 = row0y;
    const m21 = row1x;
    const m22 = row1y;
    row0x = cs * m11 + sn * m21;
    row0y = cs * m12 + sn * m22;
    row1x = -sn * m11 + cs * m21;
    row1y = -sn * m12 + cs * m22;
  }

  // const m11 = row0x;
  // const m12 = row0y;
  // const m21 = row1x;
  // const m22 = row1y;

  return createWorldTransform(translate, angle, scale, 0);
}

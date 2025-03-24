export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Limits the angle to the range [0, 2 * PI]. Will wrap around if the angle is outside this range, preserving the preceived rotation.
 *
 * @param radians The radians to limit.
 *
 * @returns The limited radians.
 */
export function limitRadiansRange(radians: number): number {
  const r = radians % (Math.PI * 2);
  return r < 0 ? r + Math.PI * 2 : r;
}

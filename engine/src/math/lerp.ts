export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

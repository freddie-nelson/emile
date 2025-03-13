export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function min(a: number, b: number): number {
  return a < b ? a : b;
}

export function max(a: number, b: number): number {
  return a > b ? a : b;
}

export function map(v: number, a: number, b: number, c: number, d: number): number {
  return c + ((d - c) * (v - a)) / (b - a);
}

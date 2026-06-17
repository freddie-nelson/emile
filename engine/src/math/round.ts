export function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

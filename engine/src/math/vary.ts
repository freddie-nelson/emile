/**
 * Varies a value by a random amount within a specified range.
 *
 * This will add or subtract a random amount from the value within the specified range (d).
 *
 * @param x The value to vary.
 * @param d The maximum amount to vary the value by.
 *
 * @returns The varied value.
 */
export default function vary(x: number, d: number) {
  return x + (Math.random() * d - d / 2);
}

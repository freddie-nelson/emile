import { Logger } from "@shared/src/Logger";

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random number between min and max, with an approximate bell curve distribution.
 *
 * @param min The minimum value (inclusive).
 * @param max The maximum value (exclusive).
 * @param dice The number of dice to roll, this is the accuracy of the bell curve distribution.
 *
 * @returns The random number.
 */
export function bellWeightedRandomFloat(min: number, max: number, dice = 20): number {
  const range = (max - min) / dice;
  let num = 0;

  for (let i = 0; i < dice; i++) {
    num += Math.random() * range;
  }

  return num + min;
}

/**
 * Generates a random integer between min and max, with an approximate bell curve distribution.
 *
 * @note uses `bellWeightedRandomFloat` to generate a float and then floors it to get an integer.
 *
 * @param min The minimum value (inclusive).
 * @param max The maximum value (exclusive).
 * @param dice The number of dice to roll, this is the accuracy of the bell curve distribution.
 *
 * @returns The random number.
 */
export function bellWeightedRandomInt(min: number, max: number, dice = 20): number {
  return Math.floor(bellWeightedRandomFloat(min, max, dice));
}

export function weightedRandomChoice<T>(arr: T[], weights: number[]): T {
  if (arr.length !== weights.length) {
    Logger.errorAndThrow("RANDOM", "Array and weights must be the same length for 'weightedRandomChoice'.");
  }

  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  const randomValue = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (let i = 0; i < arr.length; i++) {
    cumulativeWeight += weights[i];
    if (randomValue < cumulativeWeight) {
      return arr[i];
    }
  }

  return arr[arr.length - 1]; // Fallback in case of rounding errors
}

export function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomChoiceIterable<T>(iterable: Iterable<T>): T {
  const arr = Array.from(iterable);
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

export function randomAngleRadians(): number {
  return Math.random() * Math.PI * 2;
}

export function randomAngleDegrees(): number {
  return Math.random() * 360;
}

/**
 * Get a random value from an enum object.
 *
 * @note IMPORTANT: This only works with numeric enums.
 *
 * @param enumObj The enum object to get a random value from.
 *
 * @returns The random value from the enum object.
 */
export function randomEnumValue<T extends Record<string, string | number>>(enumObj: T): T[keyof T] {
  const values = Object.values(enumObj).filter((value) => typeof value === "number") as number[];
  const randomIndex = Math.floor(Math.random() * values.length);

  return values[randomIndex] as T[keyof T];
}

/**
 * Get a random value from an enum object or an additional set of values.
 *
 * @param enumObj The enum object to get a random value from.
 * @param additionalValues An array of additional values to include in the random selection.
 *
 * @returns The random value from the enum object or the additional values.
 */
export function randomEnumOrOtherValue<T extends Record<string, string | number>>(
  enumObj: T,
  additionalValues: number[] = []
): number {
  const values = Object.values(enumObj).filter((value) => typeof value === "number") as number[];
  const allValues = [...values, ...additionalValues];
  const randomIndex = Math.floor(Math.random() * allValues.length);

  return allValues[randomIndex] as number;
}

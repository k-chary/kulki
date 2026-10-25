/**
 * Every ball color, in the order a game adds them as the player picks more colors.
 * The ids double as the `data-color` values the UI styles.
 */
export const COLORS = [
  'red',
  'yellow',
  'green',
  'blue',
  'purple',
  'orange',
  'pink',
  'brown',
  'black',
] as const;

export type Color = (typeof COLORS)[number];

/** The fewest and most colors a game can use, and the default (the classic game). */
export const MIN_COLORS = 5;
export const MAX_COLORS = 9;
export const DEFAULT_COLORS = 6;

/** The color counts a player can pick, from MIN_COLORS to MAX_COLORS. */
export const COLOR_COUNTS: readonly number[] = Array.from(
  { length: MAX_COLORS - MIN_COLORS + 1 },
  (_, i) => MIN_COLORS + i,
);

/** The six colors of the classic game, in their original draw order. */
export const CLASSIC_COLORS: readonly Color[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
];

/**
 * The colors a game with `count` colors uses: the first `count` of COLORS.
 * Six gives the classic set. Throws for a count outside MIN_COLORS..MAX_COLORS.
 */
export function colorsFor(count: number): readonly Color[] {
  if (!Number.isInteger(count) || count < MIN_COLORS || count > MAX_COLORS) {
    throw new RangeError(`A game uses ${MIN_COLORS}–${MAX_COLORS} colors, got ${count}`);
  }
  return COLORS.slice(0, count);
}

/**
 * The colors of a `count`-color game in the order random draws index into them.
 * Six keeps the classic order, so a fixed seed deals the same boards as before
 * color counts existed; other counts use the COLORS order.
 */
export function drawColorsFor(count: number): readonly Color[] {
  const colors = colorsFor(count);
  return count === DEFAULT_COLORS ? CLASSIC_COLORS : colors;
}

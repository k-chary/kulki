/** The six ball colors. The ids double as the `data-color` values the UI styles. */
export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;

export type Color = (typeof COLORS)[number];

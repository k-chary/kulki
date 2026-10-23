// Animation sequencing reads its timings from the motion tokens instead of
// hard-coding them, so tokens.css stays the single source (docs/SPEC.md).

/** Anything that can look up a custom property, e.g. getComputedStyle(element). */
export interface StyleSource {
  getPropertyValue(property: string): string;
}

/**
 * Returns a motion token such as `--dur-clear` in milliseconds, as resolved on
 * the document root (or on `source`, which honors data-motion on a subtree).
 * Reduced motion sets some durations to 0ms, which comes back as 0.
 */
export function readDuration(token: string, source?: StyleSource): number {
  if (!token.startsWith('--')) throw new Error(`Not a custom property: ${token}`);
  const style = source ?? getComputedStyle(document.documentElement);
  const value = style.getPropertyValue(token).trim();
  if (value === '') throw new Error(`Missing motion token ${token}`);
  return parseDuration(value, token);
}

function parseDuration(value: string, token: string): number {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value);
  if (!match) throw new Error(`Motion token ${token} is not a duration: ${value}`);
  const amount = Number(match[1]);
  return match[2] === 's' ? amount * 1000 : amount;
}

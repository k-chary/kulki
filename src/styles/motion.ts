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

/**
 * Whether motion is reduced for `element`: a data-motion attribute on it or an
 * ancestor wins (Storybook's Motion switch), otherwise the OS setting.
 */
export function prefersReducedMotion(element: Element): boolean {
  const forced = element.closest('[data-motion]')?.getAttribute('data-motion');
  if (forced === 'reduced') return true;
  if (forced === 'full') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** The durations a turn's playback needs, in ms, as they resolve now (reduced motion included). */
export function readTurnDurations(source?: StyleSource) {
  return {
    step: readDuration('--dur-step', source),
    clear: readDuration('--dur-clear', source),
    spawn: readDuration('--dur-spawn', source),
    spawnStagger: readDuration('--dur-spawn-stagger', source),
    score: readDuration('--dur-score', source),
    shake: readDuration('--dur-shake', source),
  };
}

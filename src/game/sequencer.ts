// Plays a list of steps one after another. A step ends when enough end signals
// (animationend / transitionend) arrived, or when its fallback timer fires, so
// a hidden window that never fires them cannot stall a turn (docs/SPEC.md).

/** Extra time after a step's duration before the fallback ends it. */
export const FALLBACK_MS = 50;

export interface SequenceStep<V> {
  /** What the screen shows during this step. */
  view: V;
  /** How long the animation runs, in ms; 0 ends the step at once. */
  duration: number;
  /** End signals to wait for; 0 means a plain delay that no event shortens. */
  expect?: number;
}

export interface Sequence {
  /** One animationend / transitionend of the running step. */
  signal(): void;
  /** Stops playback; neither `onStep` nor `onDone` is called afterwards. */
  cancel(): void;
}

export interface SequenceHandlers<V> {
  onStep(view: V, index: number): void;
  onDone(): void;
}

/** Starts playing `steps` right away: the first `onStep` call happens before this returns. */
export function playSequence<V>(
  steps: readonly SequenceStep<V>[],
  { onStep, onDone }: SequenceHandlers<V>,
): Sequence {
  let index = -1;
  let signals = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const advance = (): void => {
    clearTimeout(timer);
    for (;;) {
      index += 1;
      if (stopped) return;
      const step = steps[index];
      if (!step) {
        stopped = true;
        onDone();
        return;
      }
      onStep(step.view, index);
      if (stopped) return;
      if (step.duration <= 0) continue;
      signals = 0;
      const wait = (step.expect ?? 0) > 0 ? step.duration + FALLBACK_MS : step.duration;
      timer = setTimeout(advance, wait);
      return;
    }
  };

  advance();

  return {
    signal() {
      if (stopped) return;
      const step = steps[index];
      if (!step || !step.expect) return;
      signals += 1;
      if (signals >= step.expect) advance();
    },
    cancel() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}

import { useEffect, useRef, useState } from 'react';

/**
 * A number that runs from its current value to `target` over `duration` ms and
 * jumps when the duration is 0. `duration` is read when `target` changes.
 */
export function useCountUp(target: number, duration: number): number {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  const durationRef = useRef(duration);

  useEffect(() => {
    durationRef.current = duration;
  });

  useEffect(() => {
    const from = current.current;
    const length = durationRef.current;
    const show = (value: number) => {
      current.current = value;
      setShown(value);
    };
    if (length <= 0 || from === target) {
      show(target);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const done = Math.min(1, (now - started) / length);
      show(done === 1 ? target : Math.round(from + (target - from) * done));
      if (done < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

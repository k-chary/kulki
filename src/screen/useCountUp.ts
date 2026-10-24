import { useEffect, useRef, useState } from 'react';

/**
 * A number that counts up from its current value to `target` over `duration` ms.
 * It jumps when the duration is 0 and when the target is lower (a new game starts
 * at 0 at once). `duration` is read when `target` changes.
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
    if (length <= 0 || target <= from) {
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

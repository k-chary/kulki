import type { ReactNode } from 'react';
import styles from './RailFrame.module.css';

interface RailFrameProps {
  /** Give the frame a fixed height, so a growing panel fills and scrolls. */
  tall?: boolean;
  short?: boolean;
  /** The rail at the smallest window's board height. */
  minimum?: boolean;
  children: ReactNode;
}

/** Holds rail components at the rail's real width. */
export function RailFrame({
  tall = false,
  short = false,
  minimum = false,
  children,
}: RailFrameProps) {
  return (
    <div className={styles.rail} data-tall={tall} data-short={short} data-minimum={minimum}>
      {children}
    </div>
  );
}

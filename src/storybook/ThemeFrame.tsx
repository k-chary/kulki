import type { ReactNode } from 'react';
import styles from './ThemeFrame.module.css';

export type ThemeChoice = 'light' | 'dark' | 'side';
export type MotionChoice = 'full' | 'reduced';

interface ThemeFrameProps {
  theme: ThemeChoice;
  motion: MotionChoice;
  children: ReactNode;
}

/** Renders a story on the real background, in one theme or both side by side. */
export function ThemeFrame({ theme, motion, children }: ThemeFrameProps) {
  const themes = theme === 'side' ? (['light', 'dark'] as const) : [theme];
  return (
    <div className={styles.frame} data-side={theme === 'side'}>
      {themes.map((t) => (
        <div key={t} className={styles.pane} data-theme={t} data-motion={motion}>
          {children}
        </div>
      ))}
    </div>
  );
}

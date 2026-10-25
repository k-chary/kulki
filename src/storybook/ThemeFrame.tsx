import type { ReactNode } from 'react';
import type { BallTheme } from '../format';
import styles from './ThemeFrame.module.css';

export type ThemeChoice = 'light' | 'dark' | 'side';
export type MotionChoice = 'full' | 'reduced';
export type BallThemeChoice = BallTheme;

interface ThemeFrameProps {
  theme: ThemeChoice;
  motion: MotionChoice;
  balls?: BallThemeChoice;
  children: ReactNode;
}

/** Renders a story on the real background, in one theme or both side by side, with the chosen balls. */
export function ThemeFrame({ theme, motion, balls = 'classic', children }: ThemeFrameProps) {
  const themes = theme === 'side' ? (['light', 'dark'] as const) : [theme];
  return (
    <div className={styles.frame} data-side={theme === 'side'}>
      {themes.map((t) => (
        <div
          key={t}
          className={styles.pane}
          data-theme={t}
          data-motion={motion}
          data-ball-theme={balls}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

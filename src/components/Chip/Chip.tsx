import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'soft' | 'accent' | 'warm' | 'hot';
export type ChipSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ChipProps {
  children: ReactNode;
  /** `soft` tinted, `accent` solid, `warm` and `hot` the bonus colors. */
  tone?: ChipTone;
  size?: ChipSize;
  /** `numeric` is the mono font for numbers; `label` is small uppercase text. */
  text?: 'numeric' | 'label';
  /** One pulse as the chip appears (the largest bonus step). */
  pulse?: boolean;
}

/** A small rounded badge: a gained „+50”, or a „Nowy rekord” mark. */
export function Chip({
  children,
  tone = 'soft',
  size = 'sm',
  text = 'numeric',
  pulse = false,
}: ChipProps) {
  return (
    <span
      className={styles.chip}
      data-tone={tone}
      data-size={size}
      data-text={text}
      data-pulse={pulse}
    >
      {children}
    </span>
  );
}

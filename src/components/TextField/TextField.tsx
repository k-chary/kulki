import type { ComponentProps } from 'react';
import { MAX_NAME_LENGTH } from '../../highscores/ranking';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<
  ComponentProps<'input'>,
  'className' | 'style' | 'value' | 'onChange' | 'type'
> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  hint?: string;
}

/** Characters as the player sees them (code points), so an emoji counts once. */
const length = (text: string) => Array.from(text).length;

/** A labelled text input with a „5/20” counter that turns accent at the limit. */
export function TextField({
  id,
  label,
  value,
  onChange,
  maxLength = MAX_NAME_LENGTH,
  hint,
  ...rest
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className={styles.field}>
      <div className={styles.top}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <span className={styles.count} data-full={length(value) >= maxLength} aria-hidden="true">
          {length(value)}/{maxLength}
        </span>
      </div>
      <input
        {...rest}
        id={id}
        type="text"
        className={styles.input}
        value={value}
        aria-describedby={hintId}
        onChange={(event) => onChange(Array.from(event.target.value).slice(0, maxLength).join(''))}
      />
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}

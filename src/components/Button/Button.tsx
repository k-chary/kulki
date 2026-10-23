import type { ComponentProps } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'className' | 'style'> {
  /** Primary is the one action a dialog is about; secondary everything else. */
  variant: 'primary' | 'secondary';
  /** Full width of its container. */
  block?: boolean;
}

/** A real button, 44 px tall. */
export function Button({ variant, block = false, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={styles.button}
      data-variant={variant}
      data-block={block}
    />
  );
}

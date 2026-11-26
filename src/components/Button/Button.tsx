import type { ComponentProps, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'className' | 'style'> {
  /** Primary is the one action a dialog is about; secondary everything else. */
  variant: 'primary' | 'secondary';
  /** Full width of its container. */
  block?: boolean;
  /** A decorative icon before the label (`currentColor`); with no children the button is icon only. */
  icon?: ReactNode;
  /** `md` is 44 px; `sm` is the compact 36 px of the header. */
  size?: 'md' | 'sm';
}

/** A real button, 44 px tall (36 px for `size="sm"`). */
export function Button({
  variant,
  block = false,
  size = 'md',
  icon,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={styles.button}
      data-variant={variant}
      data-block={block}
      data-size={size}
      data-icon-only={icon !== undefined && children === undefined}
    >
      {icon}
      {children}
    </button>
  );
}

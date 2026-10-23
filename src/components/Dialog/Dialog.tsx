import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import styles from './Dialog.module.css';

export interface DialogProps {
  title: string;
  /** Esc and a scrim click call onClose. Off for the name entry, which cannot be dismissed. */
  dismissible?: boolean;
  onClose?: () => void;
  /** Where focus goes on close; defaults to whatever had it when the dialog opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

/**
 * A dialog over the board: scrim, card, focus kept inside. It is placed as a child of the
 * board, so it never covers the rail. Focus goes to the first element with autoFocus, or
 * to the card.
 */
export function Dialog({
  title,
  dismissible = true,
  onClose,
  returnFocusRef,
  children,
}: DialogProps) {
  const titleId = useId();
  // Read before the first commit: an autoFocus inside the card moves focus during it.
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const card = useRef<HTMLDivElement>(null);
  const latest = useRef({ dismissible, onClose });

  useEffect(() => {
    latest.current = { dismissible, onClose };
  });

  useEffect(() => {
    const returnTo = returnFocusRef?.current;
    const element = card.current;
    if (element && !element.contains(document.activeElement)) element.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && latest.current.dismissible) {
        event.preventDefault();
        latest.current.onClose?.();
      }
      if (event.key !== 'Tab' || !element) return;
      const items = Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === element || !element.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !element.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // A passive-effect cleanup runs after the DOM update, so a button the game screen
      // disabled while the dialog was open is enabled again by now.
      const target = returnTo ?? opener;
      target?.focus();
    };
  }, [returnFocusRef, opener]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        // Keep focus where it is, so a scrim click cannot strand it outside the card.
        event.preventDefault();
        if (dismissible) onClose?.();
      }}
    >
      <div
        ref={card}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

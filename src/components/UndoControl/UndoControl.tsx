import { useId } from 'react';
import { formatUndoCost, formatUndoName, formatUndoReason } from '../../format';
import type { UndoStatus } from '../../rules';
import { Button } from '../Button/Button';
import { Chip } from '../Chip/Chip';
import styles from './UndoControl.module.css';
import { UndoIcon } from './UndoIcon';

export interface UndoControlProps {
  /** Why undo is, or is not, possible; anything but `ok` disables the button. */
  status: UndoStatus;
  /** Points one undo costs; the chip shows it even when the button is disabled. */
  cost: number;
  /** Disables the button too, while a turn animates or a dialog is open. */
  busy?: boolean;
  /** The phone's top bar: an icon-only button and the short chip. */
  compact?: boolean;
  onUndo: () => void;
}

/**
 * „Cofnij” with its cost chip. The tooltip sits on a wrapper, since a disabled button
 * does not fire hover in every WebView; the reason is also tied to the button with
 * `aria-describedby`.
 */
export function UndoControl({
  status,
  cost,
  busy = false,
  compact = false,
  onUndo,
}: UndoControlProps) {
  const reasonId = useId();
  const reason = formatUndoReason(status, cost);
  return (
    <div className={styles.control}>
      <span className={styles.tip} title={reason}>
        <Button
          variant="secondary"
          size={compact ? 'md' : 'sm'}
          icon={<UndoIcon />}
          disabled={status !== 'ok' || busy}
          aria-label={formatUndoName(cost)}
          aria-describedby={reasonId}
          onClick={onUndo}
        >
          {compact ? undefined : 'Cofnij'}
        </Button>
        <span id={reasonId} hidden>
          {reason}
        </span>
      </span>
      <Chip tone="soft" size={compact ? 'xs' : 'sm'}>
        {formatUndoCost(cost, compact)}
      </Chip>
    </div>
  );
}

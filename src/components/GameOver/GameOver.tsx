import type { RefObject } from 'react';
import { formatNumber } from '../../format';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import { NameEntry } from '../NameEntry/NameEntry';
import styles from './GameOver.module.css';

interface Common {
  /** The final score. */
  score: number;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/** Made the top 30, not saved yet. The dialog cannot be dismissed. */
interface Entry extends Common {
  state: 'entry';
  place: number;
  initialName: string;
  onSave: (name: string) => void;
  /** The last save did not go through. */
  failed?: boolean;
}

interface Saved extends Common {
  state: 'saved';
  name: string;
  place: number;
  onNewGame: () => void;
}

/** Too low for the top 30; nothing is saved. */
interface Outside extends Common {
  state: 'outside';
  /** Points missing to 30th place. */
  missing: number;
  onNewGame: () => void;
}

export type GameOverProps = Entry | Saved | Outside;

/** „Koniec gry” with the final score, in one of its three states. */
export function GameOver(props: GameOverProps) {
  const { score, returnFocusRef } = props;
  return (
    <Dialog title="Koniec gry" dismissible={false} returnFocusRef={returnFocusRef}>
      <p className={styles.final}>
        {formatNumber(score)}
        <small className={styles.unit}>pkt</small>
      </p>
      {props.state === 'entry' && (
        <NameEntry
          place={props.place}
          initialName={props.initialName}
          onSave={props.onSave}
          failed={props.failed}
        />
      )}
      {props.state === 'saved' && (
        <>
          <p className={styles.note}>
            Zapisano jako {props.name} · {props.place}. miejsce
          </p>
          <Button variant="primary" block autoFocus onClick={props.onNewGame}>
            Nowa gra
          </Button>
        </>
      )}
      {props.state === 'outside' && (
        <>
          <p className={styles.note}>
            Ten wynik nie mieści się w najlepszej trzydziestce. Do 30. miejsca brakuje{' '}
            {formatNumber(props.missing)} pkt.
          </p>
          <Button variant="primary" block autoFocus onClick={props.onNewGame}>
            Nowa gra
          </Button>
        </>
      )}
    </Dialog>
  );
}

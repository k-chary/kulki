import { Button } from '../Button/Button';
import styles from './UpdateBanner.module.css';

export interface UpdateBannerProps {
  version: string;
  /** `installing` disables the button; `failed` offers another try. */
  phase: 'available' | 'installing' | 'failed';
  /** 0..1 while installing, null when the download size is unknown. */
  progress?: number | null;
  onInstall: () => void;
  /** Absent while installing: the update cannot be put off halfway. */
  onDismiss?: () => void;
}

/** A thin bar at the very top of the window announcing a newer version. */
export function UpdateBanner({
  version,
  phase,
  progress = null,
  onInstall,
  onDismiss,
}: UpdateBannerProps) {
  const percent = progress === null ? null : Math.round(progress * 100);
  const message =
    phase === 'failed'
      ? 'Nie udało się zainstalować aktualizacji'
      : phase === 'installing'
        ? `Pobieranie wersji ${version}${percent === null ? '…' : ` · ${percent}%`}`
        : `Dostępna nowa wersja ${version}`;
  return (
    <div className={styles.banner} role="status">
      <span className={styles.message}>{message}</span>
      <Button variant="primary" onClick={onInstall} disabled={phase === 'installing'}>
        {phase === 'failed' ? 'Spróbuj ponownie' : 'Zainstaluj i uruchom ponownie'}
      </Button>
      {onDismiss && (
        <Button variant="secondary" onClick={onDismiss}>
          Później
        </Button>
      )}
    </div>
  );
}

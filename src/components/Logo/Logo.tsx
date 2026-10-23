import { Ball } from '../Ball/Ball';
import styles from './Logo.module.css';

/** „Kulki” with three balls, on the left of the header. */
export function Logo() {
  return (
    <h1 className={styles.logo}>
      Kulki
      <span className={styles.dots} aria-hidden="true">
        <Ball color="red" />
        <Ball color="yellow" />
        <Ball color="blue" />
      </span>
    </h1>
  );
}

import type { Meta, StoryObj } from '@storybook/react-vite';
import styles from './Specimen.module.css';

const BALLS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;

/** Fonts, surfaces, ball colors and one hop, to check the Theme and Motion toolbars. */
function Specimen() {
  return (
    <div className={styles.specimen}>
      <h1 className={styles.logo}>Kulki</h1>
      <div className={styles.panel}>
        <p className={styles.label}>Wynik</p>
        <p className={styles.score}>12 830</p>
        <p>Ułóż pięć kulek jednego koloru w linii. Zażółć gęślą jaźń.</p>
        <p className={styles.muted}>Następne kulki pojawią się po ruchu.</p>
      </div>
      <div className={styles.balls}>
        {BALLS.map((color) => (
          <span key={color} className={styles.ball} data-color={color} title={color} />
        ))}
        <span className={`${styles.ball} ${styles.hop}`} data-color="blue" title="hop" />
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Specimen',
  component: Specimen,
} satisfies Meta<typeof Specimen>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

import type { CSSProperties, ReactNode } from 'react';
import tokensCss from '../styles/tokens.css?raw';
import { parseTokens, tokenValues, type Token } from '../styles/tokenSheet';
import styles from './TokenSheet.module.css';

const SAMPLE = 'Kulki 1 240 — zażółć gęślą jaźń';

/** The „Tokens” docs page, rendered from tokens.css itself so it cannot drift. */
export function TokenSheet() {
  const blocks = parseTokens(tokensCss);
  const base = blocks.find((b) => b.context === 'base');
  const light = tokenValues(blocks, 'light');
  const dark = tokenValues(blocks, 'dark');
  const full = tokenValues(blocks, 'motion');
  const reduced = tokenValues(blocks, 'reduced');

  return (
    <div className={`sb-unstyled ${styles.sheet}`} data-theme="light">
      <Section title="Colors">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Token</th>
              <th>Light</th>
              <th>Dark</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {[...light.values()].map((token) => (
              <tr key={token.name}>
                <td>
                  <code>{token.name}</code>
                </td>
                <ColorCell theme="light" token={token} />
                <ColorCell theme="dark" token={dark.get(token.name)} />
                <td className={styles.note}>{token.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {base?.groups.map((group) => (
        <Section key={group.title} title={group.title}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th>Preview</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {group.tokens.map((token) => (
                <tr key={token.name}>
                  <td>
                    <code>{token.name}</code>
                  </td>
                  <td>
                    <code>{token.value}</code>
                  </td>
                  <td>{preview(token.name)}</td>
                  <td className={styles.note}>{token.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ))}

      <Section title="Motion">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Token</th>
              <th>Full</th>
              <th>Reduced</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {[...full.values()].map((token) => (
              <tr key={token.name}>
                <td>
                  <code>{token.name}</code>
                </td>
                <td>
                  <code>{token.value}</code>
                </td>
                <td>
                  <code>{reduced.get(token.name)?.value ?? token.value}</code>
                </td>
                <td className={styles.note}>{token.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

function ColorCell({ theme, token }: { theme: 'light' | 'dark'; token: Token | undefined }) {
  if (!token) return <td className={styles.note}>missing</td>;
  const isShadow = token.name.startsWith('--shadow-');
  const style: CSSProperties = isShadow
    ? { boxShadow: `var(${token.name})` }
    : { background: `var(${token.name})` };
  return (
    <td data-theme={theme} className={styles.colorCell}>
      <span className={isShadow ? styles.shadow : styles.swatch} style={style} />
      <code>{token.value}</code>
    </td>
  );
}

function preview(name: string): ReactNode {
  const value = `var(${name})`;
  if (name.startsWith('--font-')) return <span style={{ fontFamily: value }}>{SAMPLE}</span>;
  if (name.startsWith('--text-')) return <span style={{ fontSize: value }}>{SAMPLE}</span>;
  if (name.startsWith('--weight-')) return <span style={{ fontWeight: value }}>{SAMPLE}</span>;
  if (name.startsWith('--tracking-')) return <span style={{ letterSpacing: value }}>{SAMPLE}</span>;
  if (name.startsWith('--leading-')) {
    return (
      <span className={styles.leading} style={{ lineHeight: value }}>
        {SAMPLE} {SAMPLE}
      </span>
    );
  }
  if (name.startsWith('--ball-'))
    return <span className={styles.swatch} style={{ background: value }} />;
  if (name.startsWith('--space-')) return <span className={styles.bar} style={{ width: value }} />;
  if (name.startsWith('--radius-')) {
    return <span className={styles.radius} style={{ borderRadius: value }} />;
  }
  return null;
}

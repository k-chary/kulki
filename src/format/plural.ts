import { formatNumber } from './number';

const rules = new Intl.PluralRules('pl-PL');

/** Picks the Polish form for a count: one (1), few (2–4, 22–24, …) or many (0, 5–21, …). */
export function plural(count: number, one: string, few: string, many: string): string {
  switch (rules.select(count)) {
    case 'one':
      return one;
    case 'few':
      return few;
    default:
      return many;
  }
}

/** „1 kulka zbita”, „3 kulki zbite”, „5 kulek zbitych”. */
export function formatCleared(count: number): string {
  return `${formatNumber(count)} ${plural(count, 'kulka zbita', 'kulki zbite', 'kulek zbitych')}`;
}

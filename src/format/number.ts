/** U+202F, the narrow no-break space that groups thousands (docs/SPEC.md, "Typography"). */
export const GROUP_SEPARATOR = ' ';

/** An integer with thousands grouped by a narrow no-break space: 1 240, 12 830. */
export function formatNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(Math.trunc(value)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

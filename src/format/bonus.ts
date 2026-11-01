import { formatNumber } from './number';
import { plural } from './plural';

/** How loud the „+N” chip is: 0 is the plain chip, 3 the largest. */
export type ChipStep = 0 | 1 | 2 | 3;

/**
 * The chip's step for one clear. A clear with no bonus (5 balls, or any clear
 * in a game without the bonus) is step 0; then 6–8 balls, 9–12 (a full row and
 * up) and 13 or more (crossing shapes).
 */
export function chipStep(balls: number, bonus: number): ChipStep {
  if (bonus <= 0) return 0;
  if (balls >= 13) return 3;
  if (balls >= 9) return 2;
  return 1;
}

/** „9 kulek · premia +100”: what the bonus was for, shown under the chip. */
export function formatBonusDetail(balls: number, bonus: number): string {
  return `${formatNumber(balls)} ${plural(balls, 'kulka', 'kulki', 'kulek')} · premia +${formatNumber(bonus)}`;
}

/** „z premią” or „bez premii”, as list and game names use it. */
export function formatBonus(bonus: boolean): string {
  return bonus ? 'z premią' : 'bez premii';
}

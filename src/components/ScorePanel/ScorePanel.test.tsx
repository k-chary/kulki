// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScorePanel } from './ScorePanel';

afterEach(cleanup);

describe('ScorePanel', () => {
  it('shows the counting value, the chip and the plural form', () => {
    render(<ScorePanel score={1240} shownScore={1210} cleared={124} delta={50} />);
    expect(screen.getByText('1\u202f210', { normalizer: (text) => text })).toBeTruthy();
    expect(screen.getByText('+50')).toBeTruthy();
    expect(screen.getByText('124 kulki zbite')).toBeTruthy();
  });

  it('has no chip without a delta', () => {
    render(<ScorePanel score={0} cleared={0} />);
    expect(screen.getByText('0 kulek zbitych')).toBeTruthy();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });
});

describe('ScorePanel bonus chip', () => {
  it('names the bonus and takes its step', () => {
    render(<ScorePanel score={1430} cleared={133} delta={190} deltaBalls={9} deltaBonus={100} />);
    expect(screen.getByText('9 kulek · premia +100')).toBeTruthy();
    expect(screen.getByText('+190').parentElement?.dataset.step).toBe('2');
    expect(screen.getByText('+190').dataset.tone).toBe('warm');
  });

  it('stays plain without a bonus', () => {
    render(<ScorePanel score={1240} cleared={124} delta={50} deltaBalls={5} />);
    expect(screen.queryByText(/premia/)).toBeNull();
    expect(screen.getByText('+50').parentElement?.dataset.step).toBe('0');
  });
});

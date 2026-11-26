// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BonusPicker } from './BonusPicker';

afterEach(cleanup);

describe('BonusPicker', () => {
  it('offers both scorings with the chosen one checked', () => {
    render(<BonusPicker value={false} />);
    expect(screen.getByRole('radiogroup', { name: 'Punktacja' })).toBeTruthy();
    expect(screen.getAllByRole('radio').map((o) => o.textContent)).toEqual([
      'Bez premii',
      'Z premią',
    ]);
    expect(screen.getByRole('radio', { name: 'Bez premii' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByText('10 pkt za każdą kulkę')).toBeTruthy();
  });

  it('explains the bonus when it is on', () => {
    render(<BonusPicker value />);
    expect(screen.getByText(/Od 6\. kulki/)).toBeTruthy();
  });
});

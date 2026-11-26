// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BonusFilter } from './BonusFilter';

afterEach(cleanup);

describe('BonusFilter', () => {
  it('checks the shown lists and names the current game', () => {
    render(<BonusFilter value gameBonus={false} />);
    expect(screen.getByRole('radio', { name: 'z premią' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('radio', { name: 'bez premii, ta gra' })).toBeTruthy();
  });
});

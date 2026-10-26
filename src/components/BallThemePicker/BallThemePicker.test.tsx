// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BallThemePicker } from './BallThemePicker';

afterEach(cleanup);

describe('BallThemePicker', () => {
  it('offers every theme with the chosen one checked', () => {
    render(<BallThemePicker value="candy" />);
    expect(screen.getByRole('radiogroup', { name: 'Kolory kulek' })).toBeTruthy();
    const [classic, candy, cats] = screen.getAllByRole('radio');
    expect(classic?.textContent).toMatch(/^Klasyczne/);
    expect(classic?.getAttribute('aria-checked')).toBe('false');
    expect(candy?.textContent).toMatch(/^Cukierkowe/);
    expect(candy?.getAttribute('aria-checked')).toBe('true');
    expect(cats?.textContent).toMatch(/^Kotki/);
    expect(cats?.getAttribute('aria-checked')).toBe('false');
  });

  it('shows every card in its own theme and names its colors', () => {
    render(<BallThemePicker value="classic" />);
    const [classic, candy, cats] = screen.getAllByRole('radio');
    expect(classic?.getAttribute('data-ball-theme')).toBe('classic');
    expect(candy?.getAttribute('data-ball-theme')).toBe('candy');
    expect(cats?.getAttribute('data-ball-theme')).toBe('cats');
    const [, candyStrip] = screen.getAllByRole('img');
    expect(candyStrip?.getAttribute('aria-label')).toMatch(/, brązowa, czarna$/);
  });

  it('reports the clicked theme', async () => {
    const onChange = vi.fn();
    render(<BallThemePicker value="classic" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: /Cukierkowe/ }));
    expect(onChange).toHaveBeenCalledWith('candy');
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorCountPicker } from './ColorCountPicker';

afterEach(cleanup);

describe('ColorCountPicker', () => {
  it('offers 5 to 9 colors with the chosen count checked', () => {
    render(<ColorCountPicker value={6} />);
    expect(screen.getByRole('radiogroup', { name: 'Liczba kolorów' })).toBeTruthy();
    const options = screen.getAllByRole('radio');
    expect(options.map((o) => o.textContent)).toEqual(['5', '6', '7', '8', '9']);
    expect(screen.getByRole('radio', { name: '6 kolorów' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('names the colors in play and the difficulty', () => {
    render(<ColorCountPicker value={5} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'czerwona, żółta, zielona, niebieska, fioletowa',
    );
    expect(screen.getByText('łatwy')).toBeTruthy();
  });

  it('reports the clicked count', async () => {
    const onChange = vi.fn();
    render(<ColorCountPicker value={6} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '9 kolorów' }));
    expect(onChange).toHaveBeenCalledWith(9);
  });
});

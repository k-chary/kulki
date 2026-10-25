// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorCountPicker } from './ColorCountPicker';

afterEach(cleanup);

describe('ColorCountPicker', () => {
  it('offers 4 to 9 colors with the current count checked', () => {
    render(<ColorCountPicker value={6} />);
    const options = screen.getAllByRole('radio');
    expect(options.map((o) => o.textContent)).toEqual(['4', '5', '6', '7', '8', '9']);
    expect(screen.getByRole('radio', { name: '6 kolorów' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('radio', { name: '4 kolory' }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  it('names each count and its difficulty', () => {
    render(<ColorCountPicker value={6} />);
    expect(screen.getByRole('radiogroup', { name: 'Kolory' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '4 kolory' }).title).toBe('4 kolory · bardzo łatwy');
    expect(screen.getByRole('radio', { name: '9 kolorów' }).title).toBe('9 kolorów · mistrzowski');
  });

  it('reports a different count only', async () => {
    const onChange = vi.fn();
    render(<ColorCountPicker value={6} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '6 kolorów' }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('radio', { name: '9 kolorów' }));
    expect(onChange).toHaveBeenCalledWith(9);
  });

  it('ignores clicks when disabled', async () => {
    const onChange = vi.fn();
    render(<ColorCountPicker value={6} disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '8 kolorów' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

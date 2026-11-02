// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'a', label: 'Ala', marked: true },
  { value: 'b', label: 'Bob', ariaLabel: 'Bobek' },
];

afterEach(cleanup);

describe('SegmentedControl', () => {
  it('is a named radiogroup with the value chosen', () => {
    render(<SegmentedControl options={OPTIONS} value="b" ariaLabel="Imię" />);
    expect(screen.getByRole('radiogroup', { name: 'Imię' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Bobek' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Ala' }).getAttribute('aria-checked')).toBe('false');
  });

  it('reports the clicked value', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="b" ariaLabel="Imię" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Ala' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

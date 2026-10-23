// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NameEntry } from './NameEntry';

afterEach(cleanup);

const input = () => screen.getByLabelText('Twoje imię') as HTMLInputElement;

describe('NameEntry', () => {
  it('prefills the last name, focused and selected', () => {
    render(<NameEntry place={4} initialName="Harry" onSave={() => {}} />);
    expect(input().value).toBe('Harry');
    expect(document.activeElement).toBe(input());
    expect([input().selectionStart, input().selectionEnd]).toEqual([0, 5]);
  });

  it('typing replaces the selected name', async () => {
    render(<NameEntry place={4} initialName="Harry" onSave={() => {}} />);
    await userEvent.keyboard('Ola');
    expect(input().value).toBe('Ola');
  });

  it('holds at most 20 characters', async () => {
    render(<NameEntry place={4} initialName="" onSave={() => {}} />);
    await userEvent.type(input(), 'abcdefghijklmnopqrstuvwxyz');
    expect(input().value).toBe('abcdefghijklmnopqrst');
  });

  it('saves the trimmed name on Enter', async () => {
    const onSave = vi.fn();
    render(<NameEntry place={4} initialName="" onSave={onSave} />);
    await userEvent.type(input(), '  Ola  {Enter}');
    expect(onSave).toHaveBeenCalledWith('Ola');
  });

  it('saves „Gracz” for an empty field, via the button', async () => {
    const onSave = vi.fn();
    render(<NameEntry place={4} initialName="" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Zapisz wynik' }));
    expect(onSave).toHaveBeenCalledWith('Gracz');
  });

  it('shows the place, and the badge only for place 1', () => {
    const { rerender } = render(<NameEntry place={4} initialName="" onSave={() => {}} />);
    expect(screen.getByText('4. miejsce w najlepszych wynikach')).toBeTruthy();
    expect(screen.queryByText('Nowy rekord')).toBeNull();
    rerender(<NameEntry place={1} initialName="" onSave={() => {}} />);
    expect(screen.getByText('Nowy rekord')).toBeTruthy();
  });
});

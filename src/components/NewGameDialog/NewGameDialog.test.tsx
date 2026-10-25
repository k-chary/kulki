// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewGameDialog } from './NewGameDialog';

afterEach(cleanup);

describe('NewGameDialog', () => {
  it('starts with the chosen count', async () => {
    const onStart = vi.fn();
    render(<NewGameDialog colorCount={6} onCancel={vi.fn()} onStart={onStart} />);
    await userEvent.click(screen.getByRole('radio', { name: '8 kolorów' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zacznij' }));
    expect(onStart).toHaveBeenCalledWith(8);
  });

  it('focuses „Zacznij” when nothing is lost', () => {
    render(<NewGameDialog colorCount={6} onCancel={vi.fn()} onStart={vi.fn()} />);
    expect(screen.queryByText(/zostanie utracona/)).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Zacznij' }));
  });

  it('warns about a game in progress and focuses „Anuluj”', async () => {
    const onCancel = vi.fn();
    const onStart = vi.fn();
    render(<NewGameDialog colorCount={6} score={1240} onCancel={onCancel} onStart={onStart} />);
    expect(screen.getByText('Obecna gra (1 240 pkt) zostanie utracona.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Anuluj' }));
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onStart).not.toHaveBeenCalled();
  });
});

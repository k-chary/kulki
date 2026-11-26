// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UndoControl } from './UndoControl';

afterEach(cleanup);

describe('UndoControl', () => {
  it('is named with the cost, shows the chip and undoes on click', async () => {
    const onUndo = vi.fn();
    render(<UndoControl status="ok" cost={20} onUndo={onUndo} />);
    const button = screen.getByRole('button', { name: 'Cofnij ostatni ruch, minus 20 punktów' });
    expect(screen.getByText('−20 pkt')).toBeTruthy();
    expect(button.getAttribute('title') ?? button.parentElement?.getAttribute('title')).toBe(
      'Cofnij ostatni ruch (−20 pkt, Ctrl+Z)',
    );
    await userEvent.click(button);
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('explains each blocked state in the tooltip and keeps the chip', () => {
    const reasons = {
      tooFewPoints: 'Za mało punktów: cofnięcie kosztuje 20 pkt',
      nothing: 'Brak ruchu do cofnięcia',
      gameOver: 'Gra skończona',
    } as const;
    for (const [status, reason] of Object.entries(reasons)) {
      const { unmount } = render(
        <UndoControl status={status as keyof typeof reasons} cost={20} onUndo={() => undefined} />,
      );
      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.parentElement?.getAttribute('title')).toBe(reason);
      expect(button.getAttribute('aria-describedby')).toBeTruthy();
      expect(screen.getByText('−20 pkt')).toBeTruthy();
      unmount();
    }
  });

  it('is disabled while busy, and the phone form is icon only with the short chip', () => {
    render(<UndoControl status="ok" cost={60} busy compact onUndo={() => undefined} />);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('−60')).toBeTruthy();
    expect(screen.queryByText('Cofnij')).toBeNull();
  });
});

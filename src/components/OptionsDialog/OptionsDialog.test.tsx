// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OptionsDialog } from './OptionsDialog';

afterEach(cleanup);

describe('OptionsDialog', () => {
  it('reports a theme as soon as it is picked and stays open', async () => {
    const onBallThemeChange = vi.fn();
    const onClose = vi.fn();
    render(
      <OptionsDialog ballTheme="classic" onBallThemeChange={onBallThemeChange} onClose={onClose} />,
    );
    expect(screen.getByRole('dialog', { name: 'Opcje' })).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: /Cukierkowe/ }));
    expect(onBallThemeChange).toHaveBeenCalledWith('candy');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('focuses „Gotowe”, which closes it', async () => {
    const onClose = vi.fn();
    render(<OptionsDialog ballTheme="candy" onBallThemeChange={vi.fn()} onClose={onClose} />);
    const done = screen.getByRole('button', { name: 'Gotowe' });
    expect(document.activeElement).toBe(done);
    await userEvent.click(done);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Esc', async () => {
    const onClose = vi.fn();
    render(<OptionsDialog ballTheme="classic" onBallThemeChange={vi.fn()} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the next game settings only when given, and reports each change', async () => {
    const onNextGameChange = vi.fn();
    render(
      <OptionsDialog
        ballTheme="classic"
        onBallThemeChange={vi.fn()}
        nextGame={{ colorCount: 6, bonus: false }}
        onNextGameChange={onNextGameChange}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Wygląd' }).getAttribute('aria-selected')).toBe('true');
    await userEvent.click(screen.getByRole('tab', { name: 'Następna gra' }));
    expect(screen.getByRole('tabpanel', { name: 'Następna gra' })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Cukierkowe/ })).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Z premią' }));
    expect(onNextGameChange).toHaveBeenLastCalledWith({ colorCount: 6, bonus: true });
    await userEvent.click(screen.getByRole('radio', { name: '8 kolorów' }));
    expect(onNextGameChange).toHaveBeenLastCalledWith({ colorCount: 8, bonus: false });
  });

  it('has no tabs without next game settings', () => {
    render(<OptionsDialog ballTheme="classic" onBallThemeChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('switches tabs with the arrow keys', async () => {
    render(
      <OptionsDialog
        ballTheme="classic"
        onBallThemeChange={vi.fn()}
        nextGame={{ colorCount: 6, bonus: false }}
        onClose={vi.fn()}
      />,
    );
    screen.getByRole('tab', { name: 'Wygląd' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Następna gra' }));
    expect(screen.getByRole('tabpanel', { name: 'Następna gra' })).toBeTruthy();
  });
});

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
});

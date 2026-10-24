// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from './UpdateBanner';

afterEach(cleanup);

describe('UpdateBanner', () => {
  it('names the version and installs on click', async () => {
    const onInstall = vi.fn();
    render(<UpdateBanner version="0.2.0" phase="available" onInstall={onInstall} />);
    expect(screen.getByRole('status').textContent).toContain('Dostępna nowa wersja 0.2.0');
    await userEvent.click(screen.getByRole('button', { name: 'Zainstaluj i uruchom ponownie' }));
    expect(onInstall).toHaveBeenCalledOnce();
  });

  it('dismisses with „Później” when it can', async () => {
    const onDismiss = vi.fn();
    render(
      <UpdateBanner version="0.2.0" phase="available" onInstall={vi.fn()} onDismiss={onDismiss} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Później' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows the percentage and blocks the button while installing', () => {
    render(<UpdateBanner version="0.2.0" phase="installing" progress={0.42} onInstall={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toContain('42%');
    expect(
      screen
        .getByRole('button', { name: 'Zainstaluj i uruchom ponownie' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'Później' })).toBeNull();
  });

  it('offers another try after a failure', () => {
    render(<UpdateBanner version="0.2.0" phase="failed" onInstall={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toContain('Nie udało się');
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).toBeTruthy();
  });
});

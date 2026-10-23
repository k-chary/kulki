// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

afterEach(cleanup);

const scrim = (container: HTMLElement) => container.firstElementChild as HTMLElement;

function setup() {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  const { container } = render(
    <ConfirmDialog score={1240} onCancel={onCancel} onConfirm={onConfirm} />,
  );
  return { onCancel, onConfirm, container };
}

describe('ConfirmDialog', () => {
  it('asks in Polish and names the score that would be lost', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Zacząć nową grę?' })).toBeTruthy();
    // RTL's text matcher folds U+202F, so compare the raw text.
    expect(screen.getByRole('dialog').textContent).toContain(
      'Obecna gra (1\u202F240 pkt) zostanie utracona.',
    );
  });

  it('focuses „Anuluj”', () => {
    setup();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Anuluj' }));
  });

  it('cancels on „Anuluj”, Esc and a scrim click', async () => {
    const { onCancel, onConfirm, container } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(scrim(container));
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirms on „Nowa gra”', async () => {
    const { onCancel, onConfirm } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Nowa gra' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

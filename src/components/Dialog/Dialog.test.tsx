// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';

afterEach(cleanup);

const scrim = (container: HTMLElement) => container.firstElementChild as HTMLElement;

function Opener({ dismissible = true, onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} disabled={open}>
        Nowa gra
      </Button>
      {open && (
        <Dialog
          title="Okno"
          dismissible={dismissible}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <Button variant="secondary" autoFocus>
            Pierwszy
          </Button>
          <Button variant="primary">Drugi</Button>
        </Dialog>
      )}
    </>
  );
}

describe('Dialog', () => {
  it('is a labelled modal dialog', async () => {
    render(<Opener />);
    await userEvent.click(screen.getByRole('button', { name: 'Nowa gra' }));
    expect(screen.getByRole('dialog', { name: 'Okno' }).getAttribute('aria-modal')).toBe('true');
  });

  it('moves focus in, traps Tab, and returns focus to „Nowa gra” on close', async () => {
    render(<Opener />);
    const opener = screen.getByRole('button', { name: 'Nowa gra' });
    await userEvent.click(opener);
    const first = screen.getByRole('button', { name: 'Pierwszy' });
    const second = screen.getByRole('button', { name: 'Drugi' });
    expect(document.activeElement).toBe(first);
    await userEvent.tab();
    expect(document.activeElement).toBe(second);
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(second);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('focuses the card when nothing inside asks for focus', () => {
    render(<Dialog title="Okno">Treść</Dialog>);
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('closes on Esc and on a scrim click when dismissible', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog title="Okno" onClose={onClose}>
        Treść
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(scrim(container));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('ignores clicks inside the card', async () => {
    const onClose = vi.fn();
    render(
      <Dialog title="Okno" onClose={onClose}>
        Treść
      </Dialog>,
    );
    await userEvent.click(screen.getByText('Treść'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cannot be dismissed when not dismissible', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog title="Okno" dismissible={false} onClose={onClose}>
        Treść
      </Dialog>,
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(scrim(container));
    expect(onClose).not.toHaveBeenCalled();
  });
});

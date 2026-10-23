// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('reports clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="secondary" onClick={onClick}>
        Nowa gra
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Nowa gra' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('ignores clicks when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="secondary" disabled onClick={onClick}>
        Nowa gra
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Nowa gra' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is a plain button unless told to submit', () => {
    render(
      <>
        <Button variant="secondary">Anuluj</Button>
        <Button variant="primary" type="submit">
          Zapisz wynik
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Anuluj' }).getAttribute('type')).toBe('button');
    expect(screen.getByRole('button', { name: 'Zapisz wynik' }).getAttribute('type')).toBe(
      'submit',
    );
  });
});

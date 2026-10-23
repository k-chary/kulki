// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameOver } from './GameOver';

afterEach(cleanup);

const scrim = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('GameOver', () => {
  it('name entry: shows the score and the form, and cannot be dismissed', async () => {
    const onSave = vi.fn();
    const { container } = render(
      <GameOver state="entry" score={1240} place={1} initialName="Harry" onSave={onSave} />,
    );
    expect(screen.getByRole('dialog', { name: 'Koniec gry' })).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain('1\u202F240pkt');
    expect(screen.getByText('Nowy rekord')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Twoje imię'));

    await userEvent.keyboard('{Escape}');
    await userEvent.click(scrim(container));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledWith('Harry');
  });

  it('saved: names the entry and focuses „Nowa gra”', async () => {
    const onNewGame = vi.fn();
    render(<GameOver state="saved" score={900} name="Ola" place={7} onNewGame={onNewGame} />);
    expect(screen.getByText('Zapisano jako Ola · 7. miejsce')).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Nowa gra' });
    expect(document.activeElement).toBe(button);
    await userEvent.click(button);
    expect(onNewGame).toHaveBeenCalledOnce();
  });

  it('outside the top 30: says how many points are missing', () => {
    render(<GameOver state="outside" score={120} missing={380} onNewGame={() => {}} />);
    expect(
      screen.getByText(
        /Ten wynik nie mieści się w najlepszej trzydziestce\. Do 30\. miejsca brakuje\s+380 pkt\./,
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Twoje imię')).toBeNull();
  });
});

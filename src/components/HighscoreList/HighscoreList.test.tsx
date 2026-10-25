// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowsWithLive, type HighscoreEntry } from '../../highscores/ranking';
import { HighscoreList } from './HighscoreList';

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(cleanup);

const nb = '\u202f';

function entries(count: number): HighscoreEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Gracz ${i + 1}`,
    score: 3000 - i * 100,
    date: new Date(2026, 9, 18 - i, 12).toISOString(),
    colorCount: 6,
  }));
}

function scrolledRow() {
  const calls = scrollIntoView.mock.contexts;
  return calls[calls.length - 1] as HTMLElement;
}

describe('HighscoreList', () => {
  it('shows the empty message and only the current game on first launch', () => {
    render(<HighscoreList rows={rowsWithLive([], 0)} />);
    expect(
      screen.getByText('Jeszcze nie ma wyników. Twoja pierwsza gra trafi tutaj.'),
    ).toBeTruthy();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe('1.Ta grateraz0');
  });

  it('scrolls the current row into view, and again when it moves up', () => {
    const list = entries(30);
    const { rerender } = render(<HighscoreList rows={rowsWithLive(list, 1550)} />);
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrolledRow().textContent).toContain('Ta gra');
    expect(within(scrolledRow()).getByText('16.')).toBeTruthy();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });

    rerender(<HighscoreList rows={rowsWithLive(list, 1560)} />);
    expect(scrollIntoView).toHaveBeenCalledOnce(); // same place, no scroll

    rerender(<HighscoreList rows={rowsWithLive(list, 2650)} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(within(scrolledRow()).getByText('5.')).toBeTruthy();
  });

  it('scrolls the just-saved row into view with its ring', () => {
    const list = entries(30);
    render(<HighscoreList rows={rowsWithLive(list, 0).slice()} savedPlace={22} />);
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrolledRow().dataset.kind).toBe('saved');
    expect(within(scrolledRow()).getByText('22.')).toBeTruthy();
  });

  it('does not scroll when nothing is marked', () => {
    render(<HighscoreList rows={rowsWithLive(entries(30), 10)} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(30);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('jumps instead of gliding when motion is reduced', () => {
    render(
      <div data-motion="reduced">
        <HighscoreList rows={rowsWithLive(entries(30), 1550)} />
      </div>,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });

  it('stripes odd rows and formats dates and points', () => {
    render(<HighscoreList rows={rowsWithLive(entries(2), 0)} />);
    const [first, second] = screen.getAllByRole('listitem');
    expect(first?.dataset.stripe).toBe('odd');
    expect(second?.dataset.stripe).toBe('even');
    expect(first?.textContent).toBe('1.Gracz 118.10.20263 000');
    expect(screen.queryByText(/Jeszcze nie ma wyników/)).toBeNull();
  });

  describe('filter', () => {
    it('shows no filter unless asked for', () => {
      render(<HighscoreList rows={rowsWithLive(entries(2), 0)} colorCount={6} />);
      expect(screen.queryByRole('radiogroup')).toBeNull();
    });

    it("marks the shown count and the current game's count", () => {
      render(
        <HighscoreList rows={[]} colorCount={8} gameColorCount={6} onColorCountChange={() => {}} />,
      );
      expect(screen.getByRole('radiogroup', { name: 'Pokaż wyniki dla' })).toBeTruthy();
      expect(screen.getByRole('radio', { name: '8 kolorów' }).getAttribute('aria-checked')).toBe(
        'true',
      );
      expect(screen.getByRole('radio', { name: '6 kolorów, ta gra' })).toBeTruthy();
    });

    it('reports the clicked count', async () => {
      const onChange = vi.fn();
      render(
        <HighscoreList
          rows={rowsWithLive(entries(2), 0)}
          colorCount={6}
          gameColorCount={6}
          onColorCountChange={onChange}
        />,
      );
      await userEvent.click(screen.getByRole('radio', { name: '9 kolorów' }));
      expect(onChange).toHaveBeenCalledWith(9);
    });

    it("pins the current game under another count's list and jumps back on click", async () => {
      const onChange = vi.fn();
      render(
        <HighscoreList
          rows={[]}
          colorCount={8}
          gameColorCount={6}
          onColorCountChange={onChange}
          current={{ place: 4, score: 2310 }}
        />,
      );
      expect(screen.getByText('Brak wyników dla 8 kolorów.')).toBeTruthy();
      const note = screen.getByRole('button', { name: /^Ta gra: 4\. miejsce/ });
      expect(note.textContent).toBe(`4.Ta gra · 6 kolorówteraz2${nb}310`);
      await userEvent.click(note);
      expect(onChange).toHaveBeenCalledWith(6);
    });

    it('says when the current game is outside its own top 30', () => {
      render(
        <HighscoreList
          rows={[]}
          colorCount={5}
          gameColorCount={6}
          onColorCountChange={() => {}}
          current={{ place: null, score: 100 }}
        />,
      );
      expect(screen.getByRole('button', { name: /poza top 30/ }).textContent).toBe(
        '–Ta gra · 6 kolorówpoza top 30100',
      );
    });

    it("pins nothing while the current game's own list is shown", () => {
      render(
        <HighscoreList
          rows={rowsWithLive(entries(2), 2310)}
          colorCount={6}
          gameColorCount={6}
          onColorCountChange={() => {}}
          current={{ place: 2, score: 2310 }}
        />,
      );
      expect(screen.queryByRole('button', { name: /^Ta gra/ })).toBeNull();
    });
  });
});

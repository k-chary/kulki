// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rowsWithLive, type HighscoreEntry } from '../../highscores/ranking';
import { HighscoreList } from './HighscoreList';

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(cleanup);

function entries(count: number): HighscoreEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Gracz ${i + 1}`,
    score: 3000 - i * 100,
    date: new Date(2026, 9, 18 - i, 12).toISOString(),
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
});

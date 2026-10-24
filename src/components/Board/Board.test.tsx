// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

// jsdom has no AnimationEvent, and without it React listens for webkitAnimationEnd
// instead; define it before react-dom loads.
vi.hoisted(() => {
  window.AnimationEvent ??= class extends Event {} as unknown as typeof AnimationEvent;
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CELL_COUNT, cellIndex } from '../../rules';
import { Board, type CellView } from './Board';
import { fieldLabel } from './fieldLabel';

afterEach(cleanup);

function cells(): CellView[] {
  const views: CellView[] = Array.from({ length: CELL_COUNT }, () => ({ color: null }));
  views[cellIndex({ row: 3, col: 7 })] = { color: 'red', state: 'selected', ballState: 'selected' };
  return views;
}

describe('Board', () => {
  it('renders 81 fields with Polish names', () => {
    render(<Board cells={cells()} />);
    expect(screen.getAllByRole('button')).toHaveLength(81);
    expect(
      screen.getByRole('button', { name: 'Kulka czerwona, wiersz 4, kolumna 8' }).dataset.state,
    ).toBe('selected');
    expect(screen.getByRole('button', { name: 'Puste pole, wiersz 4, kolumna 7' })).toBeTruthy();
  });

  it('forwards clicks and hovers with coordinates, and null on pointer leave', () => {
    const onFieldClick = vi.fn();
    const onFieldHover = vi.fn();
    const { container } = render(
      <Board cells={cells()} onFieldClick={onFieldClick} onFieldHover={onFieldHover} />,
    );
    const field = screen.getByRole('button', { name: 'Puste pole, wiersz 6, kolumna 3' });
    fireEvent.pointerEnter(field);
    fireEvent.click(field);
    fireEvent.pointerLeave(container.firstElementChild as HTMLElement);
    expect(onFieldClick).toHaveBeenCalledWith({ row: 5, col: 2 });
    expect(onFieldHover.mock.calls).toEqual([[{ row: 5, col: 2 }], [null]]);
  });

  it('drops clicks while locked but still reports where the pointer is', () => {
    const onFieldClick = vi.fn();
    const onFieldHover = vi.fn();
    render(
      <Board cells={cells()} locked onFieldClick={onFieldClick} onFieldHover={onFieldHover} />,
    );
    const field = screen.getByRole('button', { name: 'Kulka czerwona, wiersz 4, kolumna 8' });
    fireEvent.pointerEnter(field);
    fireEvent.click(field);
    expect(onFieldClick).not.toHaveBeenCalled();
    expect(onFieldHover).toHaveBeenCalledWith({ row: 3, col: 7 });
  });

  it('sets the path color from the selected ball', () => {
    const { container } = render(<Board cells={cells()} pathColor="red" />);
    expect((container.firstElementChild as HTMLElement).dataset.path).toBe('red');
  });

  it('reports which ball finished animating', () => {
    const onBallAnimationEnd = vi.fn();
    render(<Board cells={cells()} onBallAnimationEnd={onBallAnimationEnd} />);
    const field = screen.getByRole('button', { name: 'Kulka czerwona, wiersz 4, kolumna 8' });
    fireEvent.animationEnd(field.firstElementChild as HTMLElement);
    expect(onBallAnimationEnd).toHaveBeenCalledWith({ row: 3, col: 7 });
  });

  it('draws the moving ball over the fields at its square', () => {
    const onMoveStepEnd = vi.fn();
    const { container } = render(
      <Board
        cells={cells()}
        moving={{ color: 'blue', row: 2, col: 5 }}
        onMoveStepEnd={onMoveStepEnd}
      />,
    );
    const layer = container.querySelector<HTMLElement>('[data-row="2"][data-col="5"][aria-hidden]');
    expect(layer?.style.getPropertyValue('--row')).toBe('2');
    expect(layer?.style.getPropertyValue('--col')).toBe('5');
    fireEvent.transitionEnd(layer as HTMLElement);
    expect(onMoveStepEnd).toHaveBeenCalledTimes(1);
  });
});

describe('fieldLabel', () => {
  it('names the ball color and the 1-based square', () => {
    expect(fieldLabel(0, 0, 'yellow')).toBe('Kulka żółta, wiersz 1, kolumna 1');
    expect(fieldLabel(8, 8, null)).toBe('Puste pole, wiersz 9, kolumna 9');
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Ball } from '../Ball/Ball';
import { Field } from './Field';

afterEach(cleanup);

describe('Field', () => {
  it('is a button named in Polish', () => {
    render(
      <Field row={3} col={7} hasBall label="Kulka czerwona, wiersz 4, kolumna 8">
        <Ball color="red" />
      </Field>,
    );
    const field = screen.getByRole('button', { name: 'Kulka czerwona, wiersz 4, kolumna 8' });
    expect(field.getAttribute('type')).toBe('button');
  });

  it('reports clicks and hovers', () => {
    const onClick = vi.fn();
    const onPointerEnter = vi.fn();
    render(
      <Field
        row={0}
        col={0}
        hasBall={false}
        label="Puste pole, wiersz 1, kolumna 1"
        onClick={onClick}
        onPointerEnter={onPointerEnter}
      />,
    );
    const field = screen.getByRole('button');
    fireEvent.pointerEnter(field);
    fireEvent.click(field);
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exposes its state and the lock to CSS', () => {
    render(<Field row={0} col={0} hasBall={false} label="x" state="target" locked />);
    const field = screen.getByRole('button');
    expect(field.dataset.state).toBe('target');
    expect(field.dataset.locked).toBe('true');
    expect(field.getAttribute('aria-disabled')).toBe('true');
  });
});

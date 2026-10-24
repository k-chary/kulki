// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

afterEach(cleanup);

function Controlled({ initial = '', maxLength }: { initial?: string; maxLength?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <TextField
      id="name"
      label="Twoje imię"
      value={value}
      onChange={setValue}
      maxLength={maxLength}
    />
  );
}

const input = () => screen.getByLabelText('Twoje imię') as HTMLInputElement;

describe('TextField', () => {
  it('counts characters against the default limit of 20', async () => {
    render(<Controlled />);
    expect(screen.getByText('0/20')).toBeTruthy();
    await userEvent.type(input(), 'Ola');
    expect(screen.getByText('3/20')).toBeTruthy();
  });

  it('stops at the limit and marks the counter full', async () => {
    render(<Controlled initial="Bartłomiej Kowalczy" />);
    const counter = screen.getByText('19/20');
    expect(counter.dataset.full).toBe('false');
    await userEvent.type(input(), 'kx');
    expect(input().value).toBe('Bartłomiej Kowalczyk');
    expect(counter.textContent).toBe('20/20');
    expect(counter.dataset.full).toBe('true');
  });

  it('never reports a value longer than the limit', () => {
    const onChange = vi.fn();
    render(<TextField id="n" label="Twoje imię" value="" onChange={onChange} maxLength={3} />);
    // The field cuts what the input reports, by characters rather than UTF-16 units.
    fireEvent.change(input(), { target: { value: 'Harry' } });
    expect(onChange).toHaveBeenCalledWith('Har');
    fireEvent.change(input(), { target: { value: '🎱🎱🎱🎱' } });
    expect(onChange).toHaveBeenLastCalledWith('🎱🎱🎱');
  });

  it('counts an emoji as one character', () => {
    render(<TextField id="n" label="Twoje imię" value="Ola🎱" onChange={() => {}} />);
    expect(screen.getByText('4/20')).toBeTruthy();
  });

  it('honours a custom limit and links the hint', () => {
    render(
      <TextField
        id="n"
        label="Twoje imię"
        value="Ab"
        onChange={() => {}}
        maxLength={5}
        hint="Podpowiedź"
      />,
    );
    expect(screen.getByText('2/5')).toBeTruthy();
    expect(input().getAttribute('aria-describedby')).toBe('n-hint');
  });
});

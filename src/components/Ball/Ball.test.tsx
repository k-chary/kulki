// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

// jsdom has no AnimationEvent, and without it React listens for webkitAnimationEnd
// instead; define it before react-dom loads.
vi.hoisted(() => {
  window.AnimationEvent ??= class extends Event {} as unknown as typeof AnimationEvent;
});

import { cleanup, fireEvent, render } from '@testing-library/react';
import { Ball } from './Ball';

afterEach(cleanup);

describe('Ball', () => {
  it('passes its color and state to CSS through data attributes only', () => {
    const { container } = render(<Ball color="purple" state="spawning" />);
    const ball = container.firstElementChild as HTMLElement;
    expect(ball.dataset.color).toBe('purple');
    expect(ball.dataset.state).toBe('spawning');
    expect(ball.getAttribute('style')).toBeNull();
  });

  it('sets the spawn stagger as an animation delay', () => {
    const { container } = render(<Ball color="red" state="spawning" delayMs={120} />);
    expect((container.firstElementChild as HTMLElement).style.animationDelay).toBe('120ms');
  });

  it('reports the end of its own animation', () => {
    const onAnimationEnd = vi.fn();
    const { container } = render(
      <Ball color="red" state="clearing" onAnimationEnd={onAnimationEnd} />,
    );
    fireEvent.animationEnd(container.firstElementChild as HTMLElement);
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });
});

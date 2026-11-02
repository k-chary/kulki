// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Chip } from './Chip';

afterEach(cleanup);

describe('Chip', () => {
  it('shows its content with soft tone and small size by default', () => {
    render(<Chip>+50</Chip>);
    const chip = screen.getByText('+50');
    expect(chip.dataset.tone).toBe('soft');
    expect(chip.dataset.size).toBe('sm');
  });

  it('takes tone, size and pulse', () => {
    render(
      <Chip tone="hot" size="xl" pulse>
        +420
      </Chip>,
    );
    const chip = screen.getByText('+420');
    expect(chip.dataset.tone).toBe('hot');
    expect(chip.dataset.size).toBe('xl');
    expect(chip.dataset.pulse).toBe('true');
  });
});

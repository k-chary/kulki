import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { RailFrame } from '../../storybook/RailFrame';
import { ScorePanel, type ScorePanelProps } from './ScorePanel';

/** Replays the chip every six seconds, since it fades out after --dur-delta (5 s). */
function Replaying(props: ScorePanelProps) {
  const [deltaId, setDeltaId] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDeltaId((id) => id + 1), 6000);
    return () => clearInterval(timer);
  }, []);
  return <ScorePanel {...props} deltaId={deltaId} />;
}

const meta = {
  title: 'Rail/ScorePanel',
  component: ScorePanel,
  decorators: [(Story) => <RailFrame>{Story()}</RailFrame>],
} satisfies Meta<typeof ScorePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewGame: Story = { args: { score: 0, cleared: 0 } };

export const OneBall: Story = { args: { score: 10, cleared: 1 } };

/**
 * The number runs from old to new over --dur-score while „+50” rises, stays
 * until the next score or 5 s, and fades. Step 0: a 5-ball clear, or any clear
 * in a game without the bonus.
 */
export const CountingUp: Story = {
  args: { score: 1240, shownScore: 1210, cleared: 124, delta: 50, deltaBalls: 5 },
  render: (args) => <Replaying {...args} />,
};

/** Step 1, 6–8 balls: a bit larger, in the accent. */
export const BonusSix: Story = {
  args: { score: 1310, cleared: 130, delta: 70, deltaBalls: 6, deltaBonus: 10 },
  render: (args) => <Replaying {...args} />,
};

/** Step 2, 9–12 balls (a full row and up): larger, warm amber. */
export const BonusNine: Story = {
  args: { score: 1430, cleared: 133, delta: 190, deltaBalls: 9, deltaBonus: 100 },
  render: (args) => <Replaying {...args} />,
};

/** Step 3, 13 or more (crossing shapes): largest, hot coral, one pulse as it appears. */
export const BonusThirteen: Story = {
  args: { score: 1730, cleared: 137, delta: 490, deltaBalls: 13, deltaBonus: 360 },
  render: (args) => <Replaying {...args} />,
};

/** The widest case: a five-digit score next to a star clear. */
export const BonusStarLargeScore: Story = {
  args: { score: 24680, cleared: 1290, delta: 950, deltaBalls: 17, deltaBonus: 780 },
  render: (args) => <Replaying {...args} />,
};

/** Tabular figures keep the width steady while counting. */
export const Large: Story = { args: { score: 12830, cleared: 1283 } };

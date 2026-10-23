import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { RailFrame } from '../../storybook/RailFrame';
import { ScorePanel, type ScorePanelProps } from './ScorePanel';

/** Replays the chip every two seconds, since it fades out after one run. */
function Replaying(props: ScorePanelProps) {
  const [deltaId, setDeltaId] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDeltaId((id) => id + 1), 2000);
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

/** The number runs from old to new over --dur-score while „+50” rises and fades. */
export const CountingUp: Story = {
  args: { score: 1240, shownScore: 1210, cleared: 124, delta: 50 },
  render: (args) => <Replaying {...args} />,
};

/** Tabular figures keep the width steady while counting. */
export const Large: Story = { args: { score: 12830, cleared: 1283 } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OverviewIndicators } from './overview-indicators';

const meta = {
  title: 'Features/Sessions/OverviewIndicators',
  component: OverviewIndicators,
  parameters: { layout: 'padded' },
  args: {
    now: new Date(),
    indicators: {
      running: 2,
      inactive: 1,
      inactiveSince: new Date(Date.now() - 47 * 60_000),
      sessionsToday: 14,
      endedToday: 8,
      costToday: { unpriced: false, usd: 6.14 },
    },
  },
} satisfies Meta<typeof OverviewIndicators>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Day: Story = {};

export const PartlyUnpriced: Story = {
  args: {
    indicators: {
      running: 0,
      inactive: 0,
      inactiveSince: null,
      sessionsToday: 3,
      endedToday: 3,
      costToday: { unpriced: true, usd: 0.4 },
    },
  },
};

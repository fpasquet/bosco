import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS, STORY_WAITING } from '../../fixtures';
import { groupByState } from '../../lib/overview';
import { StateBoard } from './state-board';

const meta = {
  title: 'Features/Sessions/StateBoard',
  component: StateBoard,
  parameters: { layout: 'padded' },
  args: { columns: groupByState(STORY_SESSIONS), now: new Date() },
} satisfies Meta<typeof StateBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByState: Story = {};

export const NothingInactive: Story = {
  args: { columns: groupByState(STORY_SESSIONS.filter((session) => session.state === 'running')) },
};

export const WithLiveTracking: Story = {
  args: { columns: groupByState([...STORY_WAITING, ...STORY_SESSIONS], true) },
};

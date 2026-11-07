import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS } from '../../fixtures';
import { HistoryList } from './history-list';

const today = new Date().toLocaleDateString('sv');
const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('sv');

const meta = {
  title: 'Features/Sessions/HistoryList',
  component: HistoryList,
  parameters: { layout: 'padded' },
  args: {
    now: new Date(),
    profileOf: (session) => (session.sourceId === 'perso' ? 'perso' : 'pro'),
    days: [
      { date: today, costUsd: 3.67, sessions: STORY_SESSIONS.slice(0, 3) },
      {
        date: yesterday,
        costUsd: 0.09,
        sessions: STORY_SESSIONS.slice(3).map((session) => ({ ...session, state: 'ended' as const })),
      },
    ],
  },
} satisfies Meta<typeof HistoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoDays: Story = {};

export const NothingFound: Story = { args: { days: [] } };

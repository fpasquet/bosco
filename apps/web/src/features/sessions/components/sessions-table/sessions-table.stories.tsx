import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS, STORY_SOURCES } from '../../fixtures';
import { groupByRepository, profileMark } from '../../lib/overview';
import { SessionsTable } from './sessions-table';

const meta = {
  title: 'Features/Sessions/SessionsTable',
  component: SessionsTable,
  parameters: { layout: 'padded' },
  args: {
    groups: groupByRepository(STORY_SESSIONS),
    markOf: (session) => profileMark(session, STORY_SOURCES),
    now: new Date(),
  },
} satisfies Meta<typeof SessionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByRepository: Story = {};

export const FilteredByRepository: Story = {
  args: {
    groups: groupByRepository(STORY_SESSIONS.filter((session) => session.repository?.name === 'labo-ia')),
    showFolder: true,
  },
};

export const Loading: Story = {
  args: { groups: groupByRepository(STORY_SESSIONS.slice(0, 2)), pendingRows: 4 },
};

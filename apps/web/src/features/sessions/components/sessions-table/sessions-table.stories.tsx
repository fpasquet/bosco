import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS, STORY_SOURCES } from '../../fixtures';
import { groupByProject, profileMark } from '../../lib/overview';
import { SessionsTable } from './sessions-table';

const meta = {
  title: 'Features/Sessions/SessionsTable',
  component: SessionsTable,
  parameters: { layout: 'padded' },
  args: {
    groups: groupByProject(STORY_SESSIONS),
    markOf: (session) => profileMark(session, STORY_SOURCES),
    now: new Date(),
  },
} satisfies Meta<typeof SessionsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByProject: Story = {};

export const FilteredByProject: Story = {
  args: {
    groups: groupByProject(STORY_SESSIONS.filter((session) => session.project?.name === 'labo-ia')),
    showFolder: true,
  },
};

export const Loading: Story = {
  args: { groups: groupByProject(STORY_SESSIONS.slice(0, 2)), pendingRows: 4 },
};

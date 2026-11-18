import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_GROUPS, STORY_SESSIONS, STORY_SOURCES } from '../../fixtures';
import { groupByGroup, groupByProject, profileMark } from '../../lib/overview';
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

/** Vue regroupée par groupe : une session de plusieurs groupes figure dans chacun, « aussi dans … ». */
export const ByGroup: Story = {
  args: { groups: groupByGroup(STORY_SESSIONS, STORY_GROUPS), column: 'project', headings: true },
};

/** Page d'un projet : la colonne « Dossier » remplace les intertitres. */
export const ProjectPage: Story = {
  args: {
    groups: groupByProject(STORY_SESSIONS.filter((session) => session.project?.name === 'maison')),
    column: 'folder',
  },
};

/** Page d'un groupe : la colonne « Projet » ouvre la page de chaque projet. */
export const GroupPage: Story = {
  args: { groups: [{ name: null, sessions: STORY_SESSIONS }], column: 'project' },
};

export const Loading: Story = {
  args: { groups: groupByProject(STORY_SESSIONS.slice(0, 2)), pendingRows: 4 },
};

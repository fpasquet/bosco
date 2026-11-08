import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS } from '../../fixtures';
import { WorkerTaskNotice } from './worker-task-notice';

const session = { ...STORY_SESSIONS[0]!, branch: 'bosco/t-9-fastify' };

const meta = {
  title: 'Features/Sessions/WorkerTaskNotice',
  component: WorkerTaskNotice,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    session: { ...session, task: { id: 12, state: 'to_review', failure: null, title: 'Ajouter « SNCF » au lexique' } },
  },
} satisfies Meta<typeof WorkerTaskNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToReview: Story = {};

export const Failed: Story = {
  args: {
    session: {
      ...session,
      task: {
        id: 9,
        state: 'failed',
        failure: 'Budget atteint : 0,35 $ sur 0,35 $',
        title: 'Monter la version de Fastify',
      },
    },
  },
};

export const Validated: Story = {
  args: { session: { ...session, task: { id: 7, state: 'validated', failure: null, title: 'Documenter le lexique' } } },
};

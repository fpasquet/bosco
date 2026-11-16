import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_REVIEW_TASK } from '../../fixtures';
import { TaskLog } from './task-log';

const meta = {
  title: 'Features/Tasks/TaskLog',
  component: TaskLog,
  parameters: { layout: 'padded' },
  args: {
    log: [
      ...STORY_REVIEW_TASK.log,
      { at: '2026-11-06T15:16:00.000Z', event: 'Reprise demandée', detail: 'Ajoute la variante avec points.' },
    ],
  },
} satisfies Meta<typeof TaskLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

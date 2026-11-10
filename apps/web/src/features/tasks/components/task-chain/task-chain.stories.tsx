import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_TASKS } from '../../fixtures';
import { chainOf } from '../../lib/tasks';
import { TaskChain } from './task-chain';

const meta = {
  title: 'Features/Tasks/TaskChain',
  component: TaskChain,
  parameters: { layout: 'padded' },
  args: { tasks: chainOf(STORY_TASKS) },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaskChain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** T-12 → T-13 sur la même branche, puis T-15, qui attend aussi T-14 (E5b). */
export const Chain: Story = {};

/** Survol de T-13 dans la liste : sa chaîne (T-12, T-13, T-15) est entourée, ses flèches colorées. */
export const Highlighted: Story = { args: { highlighted: 13 } };

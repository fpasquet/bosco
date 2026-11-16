import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { TaskDto } from '@bosco/domain';
import { STORY_CHANGES, STORY_REVIEW_TASK, STORY_TASKS } from '../../fixtures';
import { DiffView } from '../diff-view';
import { ResumeForm } from '../resume-form';
import { TaskThreadPanel } from './task-thread-panel';

const byId = (id: number) => STORY_TASKS.find((task) => task.id === id) as TaskDto;

/** Le fil vient de la page (composants des sessions) : ici, un fil réduit à sa consigne et à une étape. */
const thread = (
  <ol className="flex flex-col gap-2 text-sm">
    <li className="self-end rounded-card bg-primary-soft px-3 py-2">{STORY_REVIEW_TASK.instruction}</li>
    <li className="font-mono text-xs text-muted">Modifie lexique/sigles.json · +3 −0</li>
  </ol>
);

const meta = {
  title: 'Features/Tasks/TaskThreadPanel',
  component: TaskThreadPanel,
  parameters: { layout: 'padded' },
  args: { task: STORY_REVIEW_TASK, thread, changes: <DiffView changes={STORY_CHANGES} />, onCancel: fn() },
  decorators: [
    (Story) => (
      <div className="flex h-dvh max-w-3xl flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TaskThreadPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToReview: Story = {
  args: {
    composer: <ResumeForm task={STORY_REVIEW_TASK} busy={false} onResume={() => Promise.resolve(null)} />,
  },
};

export const Blocked: Story = { args: { task: byId(13), thread: null, changes: null } };

export const Running: Story = {
  args: { task: { ...STORY_REVIEW_TASK, state: 'running', outcome: { ...STORY_REVIEW_TASK.outcome, report: null } } },
};

export const Failed: Story = { args: { task: { ...byId(9), outcome: { ...byId(9).outcome, sessionId: 'a41f07c2' } } } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StepIcon } from './step-icon';

const ICONS = ['terminal', 'tests', 'edit', 'file', 'search', 'web', 'plan', 'subagent', 'tool'] as const;

const meta = {
  title: 'Features/Sessions/StepIcon',
  component: StepIcon,
  args: { icon: 'terminal', status: 'done' },
} satisfies Meta<typeof StepIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  render: () => (
    <div className="flex gap-3 text-muted">
      {ICONS.map((icon) => (
        <StepIcon key={icon} icon={icon} status="done" />
      ))}
      <StepIcon icon="terminal" status="running" />
      <StepIcon icon="terminal" status="error" />
    </div>
  ),
};

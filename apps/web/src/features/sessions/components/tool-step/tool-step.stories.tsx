import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_STEPS } from '../../fixtures';
import { stepView } from '../../lib/conversation';
import { ToolStep } from './tool-step';

const meta = {
  title: 'Features/Sessions/ToolStep',
  component: ToolStep,
  args: { live: false, view: stepView(STORY_STEPS.terminal, false) },
} satisfies Meta<typeof ToolStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Terminal: Story = {};
export const Running: Story = { args: { live: true, view: stepView(STORY_STEPS.running, true) } };
export const Interrupted: Story = { args: { view: stepView(STORY_STEPS.running, false) } };
export const TestResults: Story = { args: { view: stepView(STORY_STEPS.tests, false) } };
export const StackTrace: Story = { args: { view: stepView(STORY_STEPS.stack, false) } };
export const Edit: Story = { args: { view: stepView(STORY_STEPS.edit, false) } };
export const McpTool: Story = { args: { view: stepView(STORY_STEPS.mcp, false) } };

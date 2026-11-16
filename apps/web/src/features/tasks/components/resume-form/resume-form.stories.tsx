import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_REVIEW_TASK } from '../../fixtures';
import { ResumeForm } from './resume-form';

const meta = {
  title: 'Features/Tasks/ResumeForm',
  component: ResumeForm,
  parameters: { layout: 'padded' },
  args: { task: STORY_REVIEW_TASK, busy: false, onResume: fn(() => Promise.resolve(null)) },
} satisfies Meta<typeof ResumeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BudgetSpent: Story = {
  args: { task: { ...STORY_REVIEW_TASK, spentUsd: STORY_REVIEW_TASK.guardrails.budgetUsd } },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_WAITING } from '../../fixtures';
import { AllowDialog } from './allow-dialog';

const meta = {
  title: 'Features/Sessions/AllowDialog',
  component: AllowDialog,
  args: { session: STORY_WAITING[1] ?? null, onCancel: fn(), onConfirm: fn() },
} satisfies Meta<typeof AllowDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmOnPhone: Story = {};

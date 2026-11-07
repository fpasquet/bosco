import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_WAITING } from '../../fixtures';
import { PermissionDialog } from './permission-dialog';

const meta = {
  title: 'Features/Sessions/PermissionDialog',
  component: PermissionDialog,
  args: { mode: 'deny', session: STORY_WAITING[1] ?? null, onCancel: fn(), onConfirm: fn() },
} satisfies Meta<typeof PermissionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Deny: Story = {};

export const ConfirmAllowOnPhone: Story = { args: { mode: 'allow' } };

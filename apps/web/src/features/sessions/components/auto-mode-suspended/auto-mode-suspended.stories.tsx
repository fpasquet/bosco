import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AutoModeSuspended } from './auto-mode-suspended';

const meta = {
  title: 'Features/Sessions/AutoModeSuspended',
  component: AutoModeSuspended,
  parameters: { layout: 'padded' },
  args: { suspended: { at: '2026-11-17T14:52:00.000Z', count: 3, total: false } },
} satisfies Meta<typeof AutoModeSuspended>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Après 20 refus au total dans la session. */
export const Total: Story = { args: { suspended: { at: '2026-11-17T15:20:00.000Z', count: 20, total: true } } };

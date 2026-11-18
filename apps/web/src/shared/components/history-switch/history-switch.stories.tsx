import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HistorySwitch } from './history-switch';

const meta = {
  title: 'Shared/HistorySwitch',
  component: HistorySwitch,
  parameters: { layout: 'padded' },
  args: { current: 'sessions' },
  globals: { viewport: { value: 'mobile1' } },
} satisfies Meta<typeof HistorySwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sessions: Story = {};

export const Usage: Story = { args: { current: 'usage' } };

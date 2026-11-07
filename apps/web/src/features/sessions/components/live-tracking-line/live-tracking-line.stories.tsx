import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LiveTrackingLine } from './live-tracking-line';

const meta = {
  title: 'Features/Sessions/LiveTrackingLine',
  component: LiveTrackingLine,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LiveTrackingLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotInstalled: Story = {};

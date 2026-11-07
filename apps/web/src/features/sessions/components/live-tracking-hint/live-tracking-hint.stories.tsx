import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LiveTrackingHint } from './live-tracking-hint';

const meta = {
  title: 'Features/Sessions/LiveTrackingHint',
  component: LiveTrackingHint,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LiveTrackingHint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Proposed: Story = {};

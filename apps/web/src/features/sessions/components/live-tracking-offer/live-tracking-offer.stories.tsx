import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LiveTrackingOffer } from './live-tracking-offer';

const meta = {
  title: 'Features/Sessions/LiveTrackingOffer',
  component: LiveTrackingOffer,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { profile: 'perso', sourceId: 'perso' },
} satisfies Meta<typeof LiveTrackingOffer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

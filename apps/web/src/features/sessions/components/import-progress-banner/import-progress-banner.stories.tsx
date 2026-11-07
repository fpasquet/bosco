import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ImportProgressBanner } from './import-progress-banner';

const meta = {
  title: 'Features/Sessions/ImportProgressBanner',
  component: ImportProgressBanner,
  parameters: { layout: 'padded' },
  args: { progress: { read: 1240, total: 3180 } },
} satisfies Meta<typeof ImportProgressBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reading: Story = {};

export const AlmostDone: Story = { args: { progress: { read: 3150, total: 3180 } } };

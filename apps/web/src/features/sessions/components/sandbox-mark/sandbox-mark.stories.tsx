import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SandboxMark } from './sandbox-mark';

const meta = {
  title: 'Features/Sessions/SandboxMark',
  component: SandboxMark,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SandboxMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { PairingDialog } from './pairing-dialog';

const meta = {
  title: 'Features/Sessions/PairingDialog',
  component: PairingDialog,
  args: {
    open: true,
    now: new Date(),
    url: 'https://192.168.1.24:4871',
    code: { code: '482913', attempts: 5, expiresAt: new Date(Date.now() + 272_000).toISOString() },
    onCancel: fn(),
    onCopy: fn(),
    onNewCode: fn(),
  },
} satisfies Meta<typeof PairingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = {};

export const Expired: Story = {
  args: { code: { code: '482913', attempts: 5, expiresAt: new Date(Date.now() - 1000).toISOString() } },
};

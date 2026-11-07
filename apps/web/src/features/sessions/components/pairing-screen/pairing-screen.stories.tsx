import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PairingScreen } from './pairing-screen';

const meta = {
  title: 'Features/Sessions/PairingScreen',
  component: PairingScreen,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof PairingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnterTheCode: Story = {};

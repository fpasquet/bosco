import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SettingsPanel } from './settings-panel';

const meta = {
  title: 'Features/Sessions/SettingsPanel',
  component: SettingsPanel,
  parameters: { layout: 'padded' },
  args: { settings: { inactivityMinutes: 15, desktopNotifications: true }, busy: false, onChange: fn() },
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const Quiet: Story = { args: { settings: { inactivityMinutes: 45, desktopNotifications: false } } };

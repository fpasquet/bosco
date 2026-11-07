import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { LiveTrackingPanel } from './live-tracking-panel';

const installed = {
  installed: true,
  lastSignalAt: new Date(Date.now() - 2000).toISOString(),
  settingsPath: '/home/dev/.claude-perso/settings.json',
};

const meta = {
  title: 'Features/Sessions/LiveTrackingPanel',
  component: LiveTrackingPanel,
  parameters: { layout: 'fullscreen' },
  args: {
    source: { label: 'perso', path: '~/.claude-perso' },
    step: 'intro',
    status: { ...installed, installed: false, lastSignalAt: null },
    busy: false,
    now: new Date(),
    onClose: fn(),
    onInstall: fn(),
    onStepChange: fn(),
    onUninstall: fn(),
  },
} satisfies Meta<typeof LiveTrackingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Introduction: Story = {};

export const Installation: Story = { args: { step: 'install' } };

export const WaitingForASignal: Story = { args: { step: 'check', status: { ...installed, lastSignalAt: null } } };

export const Working: Story = { args: { step: 'check', status: installed } };

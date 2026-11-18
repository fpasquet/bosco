import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { QuotaPanel } from './quota-panel';

const meta = {
  title: 'Features/Sandbox/QuotaPanel',
  component: QuotaPanel,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    error: null,
    onScope: fn(),
    onThresholds: fn(),
    quota: {
      scope: 'sandbox',
      thresholds: { fiveHour: { wait: 50, stop: 80 }, sevenDay: { wait: 70, stop: 90 } },
      subscriptions: [
        {
          label: 'pro',
          path: '/home/dev/.claude',
          fiveHour: { usage: 36, resetsAt: '2026-11-06T15:00:00.000Z' },
          sevenDay: { usage: 14, resetsAt: '2026-11-10T09:00:00.000Z' },
        },
        {
          label: 'perso',
          path: '/home/dev/.claude-perso',
          fiveHour: { usage: 52, resetsAt: '2026-11-06T15:00:00.000Z' },
          sevenDay: { usage: 30, resetsAt: '2026-11-10T09:00:00.000Z' },
        },
      ],
    },
  },
} satisfies Meta<typeof QuotaPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NeverRead: Story = {
  args: {
    quota: {
      ...meta.args.quota,
      subscriptions: [{ label: 'pro', path: '/home/dev/.claude', fiveHour: null, sevenDay: null }],
    },
  },
};

export const WorkstationToo: Story = {
  args: { quota: { ...meta.args.quota, scope: 'all' } },
};

export const Refused: Story = {
  args: { error: 'Pour la fenêtre de 5 h, le seuil d’attente reste sous le seuil d’arrêt.' },
};

/** Sur le téléphone : jauges, seuils et portée se lisent, sans champ ni bouton. */
export const ReadOnly: Story = { args: { readOnly: true } };

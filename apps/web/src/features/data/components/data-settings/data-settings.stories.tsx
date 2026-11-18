import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { DataSettings } from './data-settings';

const meta = {
  title: 'Features/Data/DataSettings',
  component: DataSettings,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    onChooseHistory: fn(),
    onReset: fn(),
    data: {
      database: { bytes: 50_541_363, dataDir: '/home/camille/.local/share/bosco' },
      home: '/home/camille',
      history: {
        importing: false,
        oldestSessionAt: '2026-10-08T09:12:00.000Z',
        older: { profiles: ['pro', 'perso'], sessions: 312 },
        period: '30-days',
        sessions: 214,
      },
      reset: { branches: [], groups: 4, profiles: ['pro', 'perso'], projects: 15, sessions: 214, sources: 3 },
    },
  },
} satisfies Meta<typeof DataSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Les 30 derniers jours, avec des sessions plus anciennes encore dans les profils. */
export const LastThirtyDays: Story = {};

/** Tout l'historique, pendant la lecture des sessions plus anciennes. */
export const Importing: Story = {
  args: {
    data: {
      database: { bytes: 61_000_000, dataDir: '/home/camille/.local/share/bosco' },
      home: '/home/camille',
      history: {
        importing: true,
        oldestSessionAt: '2026-06-02T09:12:00.000Z',
        older: { profiles: [], sessions: 0 },
        period: 'all',
        sessions: 380,
      },
      reset: { branches: [], groups: 4, profiles: ['pro'], projects: 15, sessions: 380, sources: 3 },
    },
  },
};

/** Sur le téléphone : lecture seule, sans réinitialisation. */
export const ReadOnly: Story = { args: { readOnly: true } };

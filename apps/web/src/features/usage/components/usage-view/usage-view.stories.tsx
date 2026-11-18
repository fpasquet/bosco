import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_QUOTA, STORY_USAGE, STORY_USAGE_EMPTY, STORY_USAGE_GROUP } from '../../fixtures';
import { DEFAULT_FILTERS } from '../../lib/filters';
import { UsageView } from './usage-view';

const meta = {
  title: 'Pages/Usage/Usage',
  component: UsageView,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: {
    filters: DEFAULT_FILTERS,
    report: STORY_USAGE,
    quota: STORY_QUOTA,
    home: '/home/camille',
    today: '2026-11-17',
    groups: [
      { id: 2, name: 'Club des Trois Lacs' },
      { id: 3, name: 'Gîtes du Haut-Vallon' },
    ],
    projects: [
      { id: 1, name: 'api-tarifs' },
      { id: 2, name: 'creneaux' },
    ],
    profiles: [
      { id: 'pro', label: 'pro' },
      { id: 'perso', label: 'perso' },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof UsageView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 30 derniers jours. */
export const Default: Story = {};

/** Filtrée sur le groupe Club des Trois Lacs, 7 jours. */
export const Group: Story = {
  args: { report: STORY_USAGE_GROUP, filters: { ...DEFAULT_FILTERS, period: '7', scope: { kind: 'group', id: 2 } } },
};

export const Loading: Story = { args: { report: undefined } };

export const Empty: Story = { args: { report: STORY_USAGE_EMPTY } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

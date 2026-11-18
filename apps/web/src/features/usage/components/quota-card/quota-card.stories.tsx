import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_QUOTA } from '../../fixtures';
import { QuotaCard } from './quota-card';

const meta = {
  title: 'Features/Usage/Cards/QuotaCard',
  component: QuotaCard,
  parameters: { layout: 'padded' },
  args: { quota: STORY_QUOTA, home: '/home/camille' },
} satisfies Meta<typeof QuotaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** pro sous ses seuils ; perso au-delà du seuil d'attente de 5 h : jauge orange, icône « main » et conséquence. */
export const Default: Story = {};

/** Un abonnement jamais lu : il le sera au premier tour d'une session pilotée. */
export const NotRead: Story = {
  args: {
    quota: {
      ...STORY_QUOTA,
      subscriptions: [{ label: 'pro', path: '/home/camille/.claude', fiveHour: null, sevenDay: null }],
    },
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { SubscriptionPanel } from './subscription-panel';

const meta = {
  title: 'Features/Sandbox/SubscriptionPanel',
  component: SubscriptionPanel,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    error: null,
    onChange: fn(),
    profileHref: '/settings/sources/pro',
    subscription: STORY_ISOLATION.subscription,
  },
} satisfies Meta<typeof SubscriptionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const WithoutAccess: Story = {
  args: {
    subscription: {
      access: null,
      account: null,
      available: false,
      choices: [],
      label: null,
      profile: null,
      unavailable: [],
    },
  },
};

/** Abonnement par défaut sur un profil à jeton longue durée, sans adresse connue. */
export const LongLivedToken: Story = {
  args: {
    subscription: {
      access: 'token',
      account: null,
      available: true,
      choices: [
        {
          access: 'token',
          account: null,
          label: '~/.claude-ultra',
          path: '/home/camille/.claude-ultra',
          tokenFile: '/home/camille/.secrets/claude-ultra.token',
        },
      ],
      label: '~/.claude-ultra',
      profile: '/home/camille/.claude-ultra',
      unavailable: [],
    },
  },
};

export const Refused: Story = {
  args: { error: 'Choisis un profil surveillé qui a un accès à l’abonnement Claude.' },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

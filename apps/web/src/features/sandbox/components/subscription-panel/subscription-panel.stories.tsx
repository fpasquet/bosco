import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { SubscriptionPanel } from './subscription-panel';

const meta = {
  title: 'Features/Sandbox/SubscriptionPanel',
  component: SubscriptionPanel,
  parameters: { layout: 'padded' },
  args: { busy: false, error: null, onChange: fn(), subscription: STORY_ISOLATION.subscription },
} satisfies Meta<typeof SubscriptionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const WithoutAccess: Story = {
  args: {
    subscription: { account: null, available: false, choices: [], label: null, profile: null },
  },
};

export const Refused: Story = {
  args: { error: 'Choisis un profil surveillé qui a un accès à l’abonnement Claude.' },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

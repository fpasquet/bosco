import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LinkTabs } from './link-tabs';

const meta = {
  title: 'UI/Navigation/LinkTabs',
  component: LinkTabs,
  args: {
    label: 'Onglets du projet',
    current: '/projects/2/sessions',
    tabs: [
      { href: '/projects/2/sessions', label: 'Sessions' },
      { href: '/projects/2/context', label: 'Contexte' },
      { href: '/projects/2/settings', label: 'Réglages' },
    ],
  },
} satisfies Meta<typeof LinkTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Une décision proposée par un agent attend la validation : son compteur suit l'onglet Contexte. */
export const WithCount: Story = {
  args: {
    current: '/projects/2/settings',
    tabs: [
      { href: '/projects/2/sessions', label: 'Sessions' },
      { href: '/projects/2/context', label: 'Contexte', count: 1 },
      { href: '/projects/2/settings', label: 'Réglages' },
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumbs } from './breadcrumbs';

const meta = {
  title: 'UI/Navigation/Breadcrumbs',
  component: Breadcrumbs,
  args: { items: [{ href: '/projects', label: 'Projets' }, { label: 'site-perso' }] },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Une décision, sous l'onglet Contexte de son projet. */
export const Deep: Story = {
  args: {
    items: [
      { href: '/projects', label: 'Projets' },
      { href: '/projects/2/context', label: 'maison' },
      { label: 'DEC-6' },
    ],
  },
};

/** Sur le téléphone, le fil devient le retour à sa dernière étape. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

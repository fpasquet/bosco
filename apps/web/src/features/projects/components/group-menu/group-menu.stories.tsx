import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { GroupMenu } from './group-menu';

const meta = {
  title: 'Features/Projects/Menus/GroupMenu',
  component: GroupMenu,
  parameters: { docs: { story: { inline: false, height: '360px' } } },
  args: {
    group: { id: 2, name: 'Perso', sidebar: true },
    variant: 'header',
    onDelete: fn(),
    onSidebar: fn(),
  },
} satisfies Meta<typeof GroupMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Le menu ouvert : une session avec le groupe, ses onglets, la barre latérale et la suppression en rouge. */
export const Open: Story = { args: { defaultOpen: true } };

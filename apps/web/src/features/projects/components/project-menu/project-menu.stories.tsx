import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectMenu } from './project-menu';

const meta = {
  title: 'Features/Projects/Menus/ProjectMenu',
  component: ProjectMenu,
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  args: {
    project: { id: 2, name: 'maison', pinned: true },
    proposals: 1,
    groups: [{ id: 3, name: 'Node.js' }],
    variant: 'header',
    onAddToGroup: fn(),
    onNewGroup: fn(),
    onPin: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ProjectMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Le menu ouvert : ses onglets, ses groupes, l'épingle et le retrait en rouge. */
export const Open: Story = { args: { defaultOpen: true } };

/** Un projet pas encore épinglé, sans décision à valider. */
export const NotPinned: Story = {
  args: { defaultOpen: true, project: { id: 4, name: 'site-perso', pinned: false }, proposals: 0 },
};

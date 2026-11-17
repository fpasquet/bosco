import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { storyGroups } from '../../fixtures';
import { AddToGroupMenu } from './add-to-group-menu';

const meta = {
  title: 'Features/Projects/AddToGroupMenu',
  component: AddToGroupMenu,
  parameters: { layout: 'centered' },
  args: { groups: storyGroups, project: { id: 6, name: 'notes-clubs' }, onAdd: fn(), onNewGroup: fn() },
} satisfies Meta<typeof AddToGroupMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Le bouton fermé ; ouvert, il propose les groupes qui ne réunissent pas encore le projet. */
export const Default: Story = {};

/** api-tarifs est déjà dans Club des Trois Lacs et Node.js : seul Gîtes du Haut-Vallon est proposé. */
export const AlreadyInGroups: Story = { args: { project: { id: 4, name: 'api-tarifs' } } };

export const Disabled: Story = { args: { disabled: true } };

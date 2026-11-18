import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { projectsOverview } from '../../fixtures';
import { NewGroupDialog } from './new-group-dialog';

const meta = {
  title: 'Features/Projects/NewGroupDialog',
  component: NewGroupDialog,
  parameters: { docs: { story: { inline: false, height: '640px' } } },
  args: {
    open: true,
    busy: false,
    projects: projectsOverview.projects.map(({ id, name }) => ({ id, name })),
    serverError: null,
    onCancel: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof NewGroupDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Ouverte depuis « Ajouter à un groupe » d'api-tarifs : le projet est déjà coché, principal. */
export const FromProject: Story = { args: { initialProjects: [4] } };

/** Un groupe porte déjà ce nom : le refus s'affiche sous le champ. */
export const NameTaken: Story = { args: { serverError: 'Un groupe porte déjà ce nom.' } };

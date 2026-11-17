import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { APP_NAME } from '@bosco/domain';
import { GroupConfirmDialog, TouchedProjects } from './group-confirm-dialog';

const meta = {
  title: 'Features/Projects/GroupConfirmDialog',
  component: GroupConfirmDialog,
  parameters: { docs: { story: { inline: false, height: '320px' } } },
  args: {
    open: true,
    busy: false,
    title: 'Enregistrer les instructions ?',
    confirmLabel: 'Enregistrer',
    onCancel: fn(),
    onConfirm: fn(),
    children: (
      <TouchedProjects
        intro="Elles seront transmises aux prochains agents de"
        projects={['api-tarifs', 'creneaux', 'site-clubs']}
      />
    ),
  },
} satisfies Meta<typeof GroupConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Instructions enregistrées : la confirmation compte les projets touchés. */
export const Instructions: Story = {};

/** Un projet ajouté à un groupe qui a des instructions. */
export const ProjectAdded: Story = {
  args: {
    title: 'Ajouter notes-clubs à Club des Trois Lacs ?',
    confirmLabel: 'Ajouter',
    children: (
      <TouchedProjects
        intro="Les instructions du groupe arriveront aux prochains agents de"
        projects={['notes-clubs']}
      />
    ),
  },
};

/** Supprimer un groupe ne retire aucun projet. */
export const Delete: Story = {
  args: {
    title: 'Supprimer le groupe Club des Trois Lacs ?',
    confirmLabel: 'Supprimer le groupe',
    destructive: true,
    children: <p>Aucun projet n’est retiré : ils restent dans {APP_NAME}, avec leurs sessions et leurs décisions.</p>,
  },
};

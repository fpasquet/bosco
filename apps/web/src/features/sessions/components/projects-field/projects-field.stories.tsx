import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { OptionProject } from '../../lib/new-session';
import { ProjectsField } from './projects-field';

const project = (id: number, name: string): OptionProject => ({
  branch: 'develop',
  changes: 0,
  domains: [],
  git: true,
  id,
  name,
  place: null,
  root: `/home/dev/www/${name}`,
  startBranch: null,
});

const API_TARIFS = project(3, 'api-tarifs');
const CRENEAUX = project(4, 'creneaux');
const SITE_CLUBS = project(5, 'site-clubs');

const GROUP = {
  id: 2,
  name: 'Club des Trois Lacs',
  description: null,
  instructions: '',
  defaults: { effort: null, model: null, permissionMode: null, profile: null },
  sidebar: true,
  system: false,
  projects: [
    { id: 3, name: 'api-tarifs' },
    { id: 4, name: 'creneaux' },
    { id: 5, name: 'site-clubs' },
  ],
};

const meta = {
  title: 'Features/Sessions/ProjectsField',
  component: ProjectsField,
  parameters: { layout: 'padded' },
  args: {
    chosen: [API_TARIFS],
    group: null,
    offer: { groups: [GROUP], projects: [SITE_CLUBS, CRENEAUX] },
    onAdd: fn(),
    onChooseGroup: fn(),
    onDropGroup: fn(),
    onPrincipal: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ProjectsField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Un seul projet : sa puce porte l'étoile du projet principal. */
export const Default: Story = {};

/** Un groupe choisi : ses projets remplissent le champ, le principal en tête. */
export const Group: Story = {
  args: {
    chosen: [API_TARIFS, CRENEAUX, SITE_CLUBS],
    group: { id: GROUP.id, name: GROUP.name },
    offer: { groups: [GROUP], projects: [] },
  },
};

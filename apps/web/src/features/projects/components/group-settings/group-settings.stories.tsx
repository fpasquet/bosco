import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { clubsGroup, projectsOverview, storyProfiles } from '../../fixtures';
import { GroupSettings } from './group-settings';

const meta = {
  title: 'Features/Projects/GroupSettings',
  component: GroupSettings,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    group: clubsGroup,
    profiles: storyProfiles,
    projects: projectsOverview.projects.map(({ id, name }) => ({ id, name })),
    serverError: null,
    onArrange: fn(),
    onBrowse: fn(),
    onDelete: fn(),
    onProfile: fn(),
    onRename: fn(),
    onSidebar: fn(),
  },
} satisfies Meta<typeof GroupSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Club des Trois Lacs : api-tarifs principal, le profil pro réglé ici, affiché dans la barre latérale. */
export const Default: Story = {};

/** Profil hérité, groupe masqué de la barre latérale. */
export const Inherited: Story = {
  args: {
    group: { ...clubsGroup, defaults: { ...clubsGroup.defaults, permissionMode: null, profile: null }, sidebar: false },
  },
};

/** Le nom est déjà pris par un autre groupe. */
export const NameTaken: Story = { args: { serverError: 'Un groupe porte déjà ce nom.' } };

/** Sur le téléphone, le groupe se lit seulement. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

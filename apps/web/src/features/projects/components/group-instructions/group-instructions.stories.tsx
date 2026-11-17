import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { allProjectsGroup, clubsGroup, storyGroups } from '../../fixtures';
import { GroupInstructions } from './group-instructions';

const meta = {
  title: 'Features/Projects/GroupInstructions',
  component: GroupInstructions,
  parameters: { layout: 'padded' },
  args: { busy: false, group: clubsGroup, groups: storyGroups, onPreview: fn(), onSave: fn() },
} satisfies Meta<typeof GroupInstructions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Club des Trois Lacs : ses instructions, puis l'ordre du texte transmis à un agent d'api-tarifs. */
export const Default: Story = {};

/** Un groupe qui vient d'être créé n'a pas d'instructions. */
export const Empty: Story = { args: { group: { ...clubsGroup, instructions: '' } } };

/** « Tous les projets » : le même onglet, transmis à tous les projets. */
export const AllProjects: Story = { args: { group: allProjectsGroup } };

/** Sur le téléphone, les instructions se lisent seulement. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

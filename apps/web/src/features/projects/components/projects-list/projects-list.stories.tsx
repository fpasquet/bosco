import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { NOW, projectsOverview, storyGroups } from '../../fixtures';
import { ProjectsList } from './projects-list';

const meta = {
  title: 'Features/Projects/ProjectsList',
  component: ProjectsList,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    data: projectsOverview,
    groups: storyGroups,
    now: NOW,
    onAdd: fn(),
    onAddToGroup: fn(),
    onIgnore: fn(),
    onNewGroup: fn(),
    onOpen: fn(),
    onRestore: fn(),
  },
} satisfies Meta<typeof ProjectsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Projets choisis avec leurs groupes, dont un sans git, « Hors projet » et une suggestion ; un dossier ignoré se retrouve à part. */
export const Default: Story = {};

/** Plus aucune suggestion : la section disparaît. */
export const WithoutSuggestions: Story = {
  args: { data: { ...projectsOverview, ignored: [], suggestions: [] } },
};

/** Sur le téléphone, la liste se lit sans bouton. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

/** « Hors projet » de la barre latérale ouvre cette section : les sessions hors de tout projet. */
export const OutsideSessions: Story = {
  args: {
    outsideSessions: [
      {
        id: 'e7d2b410',
        title: 'Ranger les notes de la semaine',
        path: '/home/dev',
        lastEventAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
};

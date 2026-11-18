import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { GroupMenu } from '../group-menu';
import { ProjectMenu } from '../project-menu';
import { SidebarPlaces } from './sidebar-places';

const PROJECTS = [
  { id: 2, name: 'maison', git: true, count: 2, waiting: 1 },
  { id: 3, name: 'site-perso', git: true, count: 1, waiting: 0 },
  { id: 4, name: 'notes-clubs', git: false, count: 0, waiting: 0 },
];

const meta = {
  title: 'Features/Projects/Sidebar/SidebarPlaces',
  component: SidebarPlaces,
  decorators: [
    (Story) => (
      <aside className="flex w-60 flex-col bg-nav px-3 py-4 text-sm text-nav-muted">
        <Story />
      </aside>
    ),
  ],
  args: {
    active: { group: null, project: null, projects: false },
    allProjects: 5,
    groups: [{ id: 2, name: 'Perso', count: 3, waiting: 1 }],
    projects: PROJECTS,
    outside: { count: 1, waiting: 0 },
    onBrowse: fn(),
    onNewGroup: fn(),
    groupMenu: (id) => <GroupMenu group={{ id, name: 'Perso', sidebar: true }} onDelete={fn()} onSidebar={fn()} />,
    projectMenu: (id) => {
      const project = PROJECTS.find((candidate) => candidate.id === id) ?? PROJECTS[0];
      return (
        <ProjectMenu
          project={{ id, name: project?.name ?? '', pinned: id === 4 }}
          proposals={0}
          groups={[]}
          onAddToGroup={fn()}
          onNewGroup={fn()}
          onPin={fn()}
          onRemove={fn()}
        />
      );
    },
  },
} satisfies Meta<typeof SidebarPlaces>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** La page de maison est ouverte : sa ligne est active, son bouton ⋯ visible. */
export const ProjectActive: Story = { args: { active: { group: null, project: 2, projects: false } } };

/** La page « Tous les projets » est ouverte. */
export const AllProjects: Story = { args: { active: { group: null, project: null, projects: true } } };

/** Aucun groupe encore : l'intitulé garde son ＋. */
export const NoGroups: Story = { args: { groups: [] } };

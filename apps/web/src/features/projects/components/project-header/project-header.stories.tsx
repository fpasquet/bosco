import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectMenu } from '../project-menu';
import { ProjectHeader } from './project-header';

const meta = {
  title: 'Features/Projects/Pages/ProjectHeader',
  component: ProjectHeader,
  parameters: { layout: 'padded' },
  args: {
    project: { id: 2, name: 'labo-ia', path: '~/www/labo-ia', branch: 'develop', git: true },
    proposals: 0,
    tab: 'sessions',
    menu: (
      <ProjectMenu
        variant="header"
        project={{ id: 2, name: 'labo-ia', pinned: true }}
        proposals={0}
        groups={[]}
        onAddToGroup={fn()}
        onNewGroup={fn()}
        onPin={fn()}
        onRemove={fn()}
      />
    ),
  },
} satisfies Meta<typeof ProjectHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** L'onglet Contexte, une décision à valider : « Projets › labo-ia › Contexte ». */
export const Context: Story = { args: { tab: 'context', proposals: 1 } };

/** Une décision ouverte depuis le contexte : « Projets › labo-ia › DEC-6 », sans les onglets. */
export const Decision: Story = { args: { tab: 'context', crumb: 'DEC-6' } };

/** Un dossier sans git : ni branche ni puce « git ». */
export const WithoutGit: Story = {
  args: { project: { id: 4, name: 'notes', path: '~/notes', branch: null, git: false }, tab: 'settings' },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

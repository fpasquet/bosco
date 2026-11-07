import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SessionsSidebar } from './sessions-sidebar';

const meta = {
  title: 'Features/Sessions/SessionsSidebar',
  component: SessionsSidebar,
  decorators: [
    (Story) => (
      <aside className="flex h-96 w-60 flex-col bg-nav px-3 py-4 text-sm text-nav-muted">
        <Story />
      </aside>
    ),
  ],
  args: {
    liveTracking: false,
    selected: null,
    repositories: [
      { name: 'labo-ia', count: 3 },
      { name: 'outils-node', count: 2 },
    ],
    profiles: [
      { label: 'pro', path: '~/.claude', count: 3 },
      { label: 'perso', path: '~/.claude-perso', count: 1 },
    ],
  },
} satisfies Meta<typeof SessionsSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllRepositories: Story = {};

export const RepositorySelected: Story = { args: { selected: 'labo-ia' } };

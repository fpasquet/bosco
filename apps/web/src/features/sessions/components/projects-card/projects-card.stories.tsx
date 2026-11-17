import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectsCard } from './projects-card';

const meta = {
  title: 'Features/Sessions/ProjectsCard',
  component: ProjectsCard,
  parameters: { layout: 'padded' },
  args: {
    projects: [
      { name: 'api-tarifs', root: '/home/dev/www/api-tarifs', branch: 'feat/tarifs-clubs', files: 1 },
      { name: 'site-clubs', root: '/home/dev/www/site-clubs', branch: 'main', files: 2 },
      { name: 'creneaux', root: '/home/dev/www/creneaux', branch: 'develop', files: 0 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProjectsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sur le poste : le principal, où elle tourne, puis les projets qu'elle voit. */
export const Default: Story = {};

/** En bac à sable : la carte « Branches », une copie par projet sur la même branche. */
export const Sandbox: Story = {
  args: {
    onRetrieve: fn(),
    projects: [
      {
        name: 'api-tarifs',
        root: '/home/dev/www/api-tarifs',
        branch: 'bosco/s-bloc-tarifs',
        from: 'develop',
        files: 2,
        retrievedAt: '2026-11-06T15:16:00.000Z',
      },
      { name: 'site-clubs', root: '/home/dev/www/site-clubs', branch: 'bosco/s-bloc-tarifs', from: 'main', files: 0 },
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useQueryClient } from '@tanstack/react-query';
import type { ContainersDto } from '@bosco/domain';
import { containersQuery } from '../../api/containers';
import { STORY_CONTAINERS, STORY_DOCKER_DOWN } from '../../fixtures';
import { ContainersSummary } from './containers-summary';

function Seeded({ children, view }: { children: React.ReactNode; view: ContainersDto }) {
  useQueryClient().setQueryData(containersQuery.queryKey, view);
  return <div className="w-60 bg-nav p-3">{children}</div>;
}

const meta = {
  title: 'Features/Tasks/ContainersSummary',
  component: ContainersSummary,
  decorators: [
    (Story, { parameters }) => (
      <Seeded view={(parameters.containers as ContainersDto | undefined) ?? STORY_CONTAINERS}>
        <Story />
      </Seeded>
    ),
  ],
} satisfies Meta<typeof ContainersSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** « Conteneurs · 2 agents · 5,7 Go » en bas de la barre latérale. */
export const Running: Story = {};

/** « Docker ne répond pas », en orange : Bosco ne sait plus si quelque chose tourne. */
export const DockerDown: Story = { parameters: { containers: STORY_DOCKER_DOWN } };

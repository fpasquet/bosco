import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useQueryClient } from '@tanstack/react-query';
import type { ContainersDto } from '@bosco/domain';
import { containersQuery } from '../../api/containers';
import { STORY_CONTAINERS, STORY_DOCKER_DOWN, STORY_LEFTOVERS } from '../../fixtures';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { ContainersDock } from './containers-dock';

/** Le cache des conteneurs rempli comme par le flux en direct, et le panneau déplié. */
function Seeded({ children, view }: { children: React.ReactNode; view: ContainersDto }) {
  const client = useQueryClient();
  client.setQueryData(containersQuery.queryKey, view);
  useContainersPanel.setState({ open: true });
  return <div className="relative h-screen bg-canvas">{children}</div>;
}

const meta = {
  title: 'Features/Tasks/ContainersDock',
  component: ContainersDock,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, { parameters }) => (
      <Seeded view={(parameters.containers as ContainersDto | undefined) ?? STORY_CONTAINERS}>
        <Story />
      </Seeded>
    ),
  ],
} satisfies Meta<typeof ContainersDock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** E19a : T-18 près de son plafond, T-17 et ses trois services, une session pilotée. */
export const Running: Story = {};

/** E19d : les conteneurs de T-9, restés après son échec, en tête du panneau. */
export const Leftovers: Story = { parameters: { containers: STORY_LEFTOVERS } };

/** E19c : Docker ne répond plus, la dernière mesure reste, datée, actions désactivées. */
export const DockerDown: Story = { parameters: { containers: STORY_DOCKER_DOWN } };

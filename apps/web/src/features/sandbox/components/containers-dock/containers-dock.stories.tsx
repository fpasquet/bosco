import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useQueryClient } from '@tanstack/react-query';
import type { ContainersDto } from '@bosco/domain';
import { containersQuery } from '../../api/containers';
import { STORY_CONTAINERS, STORY_DOCKER_DOWN } from '../../fixtures';
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
  title: 'Features/Sandbox/ContainersDock',
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

/** E19a : un bac à sable près de son plafond, un autre, et un tour piloté sur le poste. */
export const Running: Story = {};

/** E19c : Docker ne répond plus, la dernière mesure reste, datée, actions désactivées. */
export const DockerDown: Story = { parameters: { containers: STORY_DOCKER_DOWN } };

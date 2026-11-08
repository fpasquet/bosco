import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useNotices } from '@/shared/hooks/use-notices';
import { Notices } from './notices';

const meta = {
  title: 'Shared/Notices',
  component: Notices,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      useNotices.setState({
        notices: [
          { id: 1, text: 'Autorisé · Specs du tableau de bord Bosco', tone: 'success' },
          { id: 2, text: 'Répondu dans le terminal · Digest quotidien de la veille média', tone: 'info' },
        ],
      });
      return (
        <div className="h-64">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Notices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settled: Story = {};

/** Un message qui propose une action, le temps qu'il reste affiché (E13c). */
export const WithAction: Story = {
  decorators: [
    (Story) => {
      useNotices.setState({
        notices: [
          {
            id: 3,
            text: 'T-12 annulée',
            tone: 'info',
            action: { label: 'Annuler l’annulation', run: () => undefined },
          },
        ],
      });
      return <Story />;
    },
  ],
};

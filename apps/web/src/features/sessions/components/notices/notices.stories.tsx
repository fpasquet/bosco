import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useNotices } from '../../lib/notices';
import { Notices } from './notices';

const meta = {
  title: 'Features/Sessions/Notices',
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

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useNotices } from '@/shared/hooks/use-notices';
import { Notices } from './notices';

const meta = {
  title: 'Shared/Notices',
  component: Notices,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="h-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Notices>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Les trois sens d'un message : réussi, information avec action, question qui reste affichée. */
export const ThreeKinds: Story = {
  decorators: [
    (Story) => {
      useNotices.setState({
        notices: [
          {
            duration: null,
            id: 1,
            line: 'Bash · npm run db:migrate',
            text: 'Autorisé · Ajouter les catégories au budget du foyer',
            tone: 'success',
          },
          {
            action: { label: 'Annuler l’annulation', run: () => undefined },
            duration: null,
            id: 2,
            line: 'Documenter les catégories dans le README',
            text: 'T-17 annulée',
            tone: 'info',
          },
          {
            action: { label: 'Ouvrir', run: () => undefined },
            duration: null,
            id: 3,
            line: '« Le récapitulatif est généré. Veux-tu que je lance les tests ? »',
            text: 'Question · Récapitulatif quotidien de l’agenda',
            tone: 'warning',
          },
        ],
      });
      return <Story />;
    },
  ],
};

export const Phone: Story = { ...ThreeKinds, globals: { viewport: { value: 'mobile1' } } };

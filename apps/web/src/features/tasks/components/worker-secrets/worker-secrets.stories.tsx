import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { WorkerSecrets } from './worker-secrets';

const meta = {
  title: 'Features/Tasks/WorkerSecrets',
  component: WorkerSecrets,
  parameters: { layout: 'padded' },
  args: { busy: false, onChange: fn(), secrets: STORY_ISOLATION.secrets },
} satisfies Meta<typeof WorkerSecrets>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Abonnement du profil pro et .npmrc avec un registre privé (E11b). */
export const ProfileAndNpmrc: Story = {};

/** Aucun accès à l'abonnement, aucun .npmrc. */
export const Missing: Story = {
  args: {
    secrets: {
      claude: { account: null, available: false, choices: [], label: null, profile: null },
      npmrc: { exists: false, path: '~/.npmrc', registries: [] },
    },
  },
};

/** Un chemin relatif refusé par Bosco. */
export const Refused: Story = { args: { error: 'Écris le chemin du fichier comme dans le terminal : ~/.npmrc.' } };

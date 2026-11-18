import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SandboxCard } from './sandbox-card';

const meta = {
  title: 'Features/Sessions/SandboxCard',
  component: SandboxCard,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    onRemove: fn(),
    onRetrieve: fn(),
    onStop: fn(),
    sandbox: {
      branch: 'bosco/s-typescript-6',
      copies: [],
      from: 'develop',
      removed: false,
      retrievedAt: null,
      services: { error: null, services: [] },
      state: 'running',
      stopsAt: '2026-11-06T15:42:00.000Z',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SandboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

/** Démarré et mesuré : le processeur et la mémoire du conteneur, rapportés à ses plafonds. */
export const Measured: Story = {
  args: { usage: { cpu: 0, cpuLimit: 2, memory: 1.3 * 1024 ** 3, memoryLimit: 4 * 1024 ** 3 } },
};

/** Les services de données du projet démarrés avec le bac à sable : la base prête, le cache en échec. */
export const WithServices: Story = {
  args: {
    sandbox: {
      ...meta.args.sandbox,
      services: {
        error: null,
        services: [
          { error: null, image: 'postgres:16.13-alpine', name: 'db', state: 'ready' },
          { error: 'Contrôle de santé en échec', image: 'redis:8.2-alpine', name: 'cache', state: 'failed' },
        ],
      },
    },
  },
};

export const Stopped: Story = {
  args: { sandbox: { ...meta.args.sandbox, state: 'stopped', retrievedAt: '2026-11-06T15:16:00.000Z' } },
};

export const Removed: Story = { args: { sandbox: { ...meta.args.sandbox, state: 'missing', removed: true } } };

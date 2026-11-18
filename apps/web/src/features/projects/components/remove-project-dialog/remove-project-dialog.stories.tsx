import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { RemoveProjectDialog } from './remove-project-dialog';

const meta = {
  title: 'Features/Projects/Dialogs/RemoveProjectDialog',
  component: RemoveProjectDialog,
  parameters: { docs: { story: { inline: false, height: '520px' } } },
  args: {
    open: true,
    busy: false,
    name: 'site-perso',
    sessions: 12,
    decisions: 4,
    running: 0,
    groups: [
      { name: 'Perso', next: 'maison' },
      { name: 'Node.js', next: null },
    ],
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof RemoveProjectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Une session pilotée tourne encore dans le projet : le bouton est grisé, avec la raison. */
export const RunningSession: Story = { args: { running: 1 } };

/** Un projet sans groupe ni décision. */
export const Alone: Story = { args: { sessions: 1, decisions: 0, groups: [] } };

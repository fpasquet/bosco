import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlanQueue } from './plan-queue';

const meta = {
  title: 'Features/Sessions/PlanQueue',
  component: PlanQueue,
  args: {
    live: true,
    todos: [
      { content: 'Relire l’import des ingrédients', status: 'completed' },
      { content: 'Recoller les quantités sur deux lignes', status: 'completed' },
      { content: 'Corriger la recette sans quantité', status: 'in_progress' },
      { content: 'Relancer toute la suite', status: 'pending' },
    ],
  },
} satisfies Meta<typeof PlanQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const AllDone: Story = {
  args: { live: false, todos: [{ content: 'Relire l’import des ingrédients', status: 'completed' }] },
};

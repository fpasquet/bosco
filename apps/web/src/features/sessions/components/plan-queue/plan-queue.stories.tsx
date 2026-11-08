import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlanQueue } from './plan-queue';

const meta = {
  title: 'Features/Sessions/PlanQueue',
  component: PlanQueue,
  args: {
    live: true,
    todos: [
      { content: 'Relire le découpage des PDF', status: 'completed' },
      { content: 'Regrouper les lignes d’un tableau', status: 'completed' },
      { content: 'Corriger le tableau sur deux pages', status: 'in_progress' },
      { content: 'Relancer toute la suite', status: 'pending' },
    ],
  },
} satisfies Meta<typeof PlanQueue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const AllDone: Story = {
  args: { live: false, todos: [{ content: 'Relire le découpage des PDF', status: 'completed' }] },
};

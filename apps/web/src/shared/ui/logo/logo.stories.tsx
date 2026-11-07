import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Logo } from './logo';

const meta = {
  title: 'UI/Logo',
  component: Logo,
  parameters: {
    docs: {
      description: {
        component: 'Sifflet de bosco, blanc sur `primary`. Décoratif à côté du nom, nommé quand il est seul.',
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {};

export const Labelled: Story = { args: { labelled: true } };

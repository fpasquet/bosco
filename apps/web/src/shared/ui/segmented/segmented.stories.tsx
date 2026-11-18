import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Segmented } from './segmented';

const meta = {
  title: 'UI/Forms/Segmented',
  component: Segmented,
  parameters: { layout: 'centered' },
  args: {
    label: 'Période',
    value: '30',
    onChange: fn(),
    options: [
      { value: '7', label: '7 j' },
      { value: '30', label: '30 j' },
      { value: '90', label: '90 j' },
      { value: 'all', label: 'Depuis le début', short: 'Tout' },
    ],
  },
} satisfies Meta<typeof Segmented<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Measure: Story = {
  args: {
    label: 'Mesure du graphique',
    value: 'tokens',
    options: [
      { value: 'tokens', label: 'Tokens' },
      { value: 'cost', label: 'Coût estimé' },
    ],
  },
};

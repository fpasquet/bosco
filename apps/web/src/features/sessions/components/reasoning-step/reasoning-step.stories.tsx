import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ReasoningStep } from './reasoning-step';

const meta = {
  title: 'Features/Sessions/ReasoningStep',
  component: ReasoningStep,
  args: { seconds: 4, text: 'Le découpage travaille **bloc par bloc** : un tableau est coupé entre deux blocs.' },
} satisfies Meta<typeof ReasoningStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithText: Story = {};

export const Hidden: Story = { args: { text: '' } };

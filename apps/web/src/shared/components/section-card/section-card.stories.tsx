import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionCard } from './section-card';

const meta = {
  title: 'Shared/SectionCard',
  component: SectionCard,
  args: {
    title: 'Identité',
    children: (
      <p>
        <span className="text-muted">Chemin</span> <span className="font-mono">~/labo-ia</span>
      </p>
    ),
  },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionSkeleton } from './section-skeleton';

const meta = {
  title: 'Shared/SectionSkeleton',
  component: SectionSkeleton,
  args: { rows: 3 },
} satisfies Meta<typeof SectionSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

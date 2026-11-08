import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    docs: { description: { component: 'Classe `skeleton` de daisyUI, sur le fond `surface-alt` des maquettes.' } },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blocks: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Skeleton className="h-4 w-56" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-7" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  ),
};

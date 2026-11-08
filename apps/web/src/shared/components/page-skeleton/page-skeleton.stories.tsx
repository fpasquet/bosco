import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageSkeleton } from './page-skeleton';

const meta = {
  title: 'Shared/PageSkeleton',
  component: PageSkeleton,
  parameters: { layout: 'fullscreen' },
  args: { variant: 'list' },
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = { args: { indicators: true } };
export const List: Story = {};
export const Detail: Story = { args: { variant: 'detail', rows: 8 } };
export const Cards: Story = { args: { variant: 'cards', rows: 2 } };
export const Form: Story = { args: { variant: 'form', rows: 4 } };

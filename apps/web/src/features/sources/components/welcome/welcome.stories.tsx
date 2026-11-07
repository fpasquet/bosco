import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Welcome } from './welcome';

const meta = { title: 'Features/Sources/Welcome', component: Welcome, parameters: { layout: 'padded' } } satisfies Meta<
  typeof Welcome
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

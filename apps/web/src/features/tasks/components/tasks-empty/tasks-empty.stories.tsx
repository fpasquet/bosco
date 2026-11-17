import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TasksEmpty } from './tasks-empty';

const meta = {
  title: 'Features/Tasks/TasksEmpty',
  component: TasksEmpty,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TasksEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstUse: Story = {};

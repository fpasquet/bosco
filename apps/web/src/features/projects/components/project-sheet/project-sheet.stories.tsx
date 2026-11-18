import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectSheet } from './project-sheet';

const meta = {
  title: 'Features/Projects/Menus/ProjectSheet',
  component: ProjectSheet,
  parameters: { docs: { story: { inline: false, height: '520px' } } },
  globals: { viewport: { value: 'mobile1' } },
  args: {
    project: { id: 2, name: 'maison', path: '~/www/maison · develop' },
    proposals: 1,
    onClose: fn(),
  },
} satisfies Meta<typeof ProjectSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { IsolationResources } from './isolation-resources';

const meta = {
  title: 'Features/Tasks/IsolationResources',
  component: IsolationResources,
  parameters: { layout: 'padded' },
  args: { isolation: STORY_ISOLATION, busy: false, onMaxAgents: fn() },
} satisfies Meta<typeof IsolationResources>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

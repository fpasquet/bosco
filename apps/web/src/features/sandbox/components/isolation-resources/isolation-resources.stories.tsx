import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_ISOLATION } from '../../fixtures';
import { IsolationResources } from './isolation-resources';

const meta = {
  title: 'Features/Sandbox/IsolationResources',
  component: IsolationResources,
  parameters: { layout: 'padded' },
  args: { isolation: STORY_ISOLATION },
} satisfies Meta<typeof IsolationResources>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

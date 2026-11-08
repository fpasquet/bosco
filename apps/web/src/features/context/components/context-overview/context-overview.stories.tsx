import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_CONTEXT } from '../../fixtures';
import { ContextOverview } from './context-overview';

const meta = {
  title: 'Features/Context/ContextOverview',
  component: ContextOverview,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { context: STORY_CONTEXT, busy: false, onPreview: fn(), onSaveArchitecture: fn() },
} satisfies Meta<typeof ContextOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ApiVoix: Story = {};

export const Empty: Story = {
  args: {
    context: {
      ...STORY_CONTEXT,
      decisions: [],
      proposed: [],
      excluded: [],
      socles: [],
      architecture: { calls: [], calledBy: [] },
    },
  },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

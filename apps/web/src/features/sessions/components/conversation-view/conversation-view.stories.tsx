import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_CONVERSATION } from '../../fixtures';
import { ConversationView } from './conversation-view';

const meta = {
  title: 'Features/Sessions/ConversationView',
  component: ConversationView,
  parameters: { layout: 'padded' },
  args: { conversation: STORY_CONVERSATION, live: true },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConversationView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Ended: Story = { args: { live: false } };

export const Partial: Story = { args: { conversation: { ...STORY_CONVERSATION, partial: true } } };

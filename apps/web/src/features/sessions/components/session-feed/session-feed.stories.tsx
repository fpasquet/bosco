import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_JOURNAL, STORY_RUNNING } from '../../fixtures';
import { SessionFeed } from './session-feed';

const meta = {
  title: 'Features/Sessions/SessionFeed',
  component: SessionFeed,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="flex h-96 flex-col">
        <Story />
      </div>
    ),
  ],
  args: { session: STORY_RUNNING, journal: STORY_JOURNAL, now: new Date() },
} satisfies Meta<typeof SessionFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Empty: Story = { args: { journal: [] } };

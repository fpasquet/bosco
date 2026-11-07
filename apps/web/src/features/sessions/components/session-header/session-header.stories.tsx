import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_RUNNING, STORY_WAITING } from '../../fixtures';
import { SessionHeader } from './session-header';

const meta = {
  title: 'Features/Sessions/SessionHeader',
  component: SessionHeader,
  parameters: { layout: 'padded' },
  args: { session: STORY_RUNNING, now: new Date(), mark: null, profile: 'pro', resume: null, onCopy: fn() },
} satisfies Meta<typeof SessionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Waiting: Story = {
  args: { session: STORY_WAITING[1] ?? STORY_RUNNING, mark: 'perso', profile: 'perso' },
};

export const Closed: Story = {
  args: { session: { ...STORY_RUNNING, state: 'ended' }, resume: 'claude --resume 5e0a91c3' },
};

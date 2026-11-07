import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_WAITING } from '../../fixtures';
import { WaitingBanner } from './waiting-banner';

const meta = {
  title: 'Features/Sessions/WaitingBanner',
  component: WaitingBanner,
  parameters: { layout: 'padded' },
  args: { sessions: STORY_WAITING, now: new Date(), busyId: null, onAllow: fn(), onDeny: fn() },
} satisfies Meta<typeof WaitingBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoSessions: Story = {};

export const OnePermission: Story = { args: { sessions: STORY_WAITING.slice(1) } };

export const Answering: Story = { args: { busyId: 'c41e9a07' } };

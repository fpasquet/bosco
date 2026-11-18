import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_USAGE, STORY_USAGE_GROUP } from '../../fixtures';
import { ActivityTiles } from './activity-tiles';

const meta = {
  title: 'Features/Usage/Cards/ActivityTiles',
  component: ActivityTiles,
  parameters: { layout: 'padded' },
  args: { activity: STORY_USAGE.activity },
} satisfies Meta<typeof ActivityTiles>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 46 sessions pilotées, 31 h 20 de travail des agents, 12 bacs à sable, 9 branches, 7 PR. */
export const Default: Story = {};

export const Group: Story = { args: { activity: STORY_USAGE_GROUP.activity } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

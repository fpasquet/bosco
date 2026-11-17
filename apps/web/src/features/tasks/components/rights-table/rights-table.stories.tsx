import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_RIGHTS } from '../../fixtures';
import { RightsTable } from './rights-table';

const meta = {
  title: 'Features/Tasks/RightsTable',
  component: RightsTable,
  parameters: { layout: 'padded' },
  args: {
    rights: STORY_RIGHTS,
    repository: 'api-voix',
    busy: false,
    error: null,
    onSave: fn(() => Promise.resolve()),
    onAccount: fn(() => Promise.resolve()),
  },
} satisfies Meta<typeof RightsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Repository: Story = {};

export const General: Story = {
  args: {
    repository: null,
    rights: { ...STORY_RIGHTS, repository: null, effective: STORY_RIGHTS.general, pending: [] },
  },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

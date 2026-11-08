import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_PREVIEW } from '../../fixtures';
import { PreviewDialog } from './preview-dialog';

const meta = {
  title: 'Features/Context/PreviewDialog',
  component: PreviewDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true, preview: STORY_PREVIEW, repository: 'api-voix', onClose: fn(), onCopy: fn() },
} satisfies Meta<typeof PreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ApiVoix: Story = {};

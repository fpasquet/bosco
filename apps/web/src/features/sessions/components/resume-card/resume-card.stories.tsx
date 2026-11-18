import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ResumeCard } from './resume-card';

const meta = {
  title: 'Features/Sessions/ResumeCard',
  component: ResumeCard,
  parameters: { layout: 'padded' },
  args: {
    onCopy: fn(),
    resume:
      'CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --resume d93b51f0 --add-dir ~/www/site-clubs --add-dir ~/www/creneaux',
  },
} satisfies Meta<typeof ResumeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Pendant un tour : la commande attend la fin du tour. */
export const Running: Story = { args: { resume: null } };

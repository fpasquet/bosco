import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProfileChoice } from './profile-choice';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const meta = {
  title: 'Features/Sources/ProfileChoice',
  component: ProfileChoice,
  parameters: { layout: 'padded' },
  args: {
    home: '/home/dev',
    candidates: [
      { path: '/home/dev/.claude', repositoryCount: 29, lastSessionAt: minutesAgo(3) },
      { path: '/home/dev/.claude-perso', repositoryCount: 20, lastSessionAt: minutesAgo(0.7) },
    ],
  },
} satisfies Meta<typeof ProfileChoice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoProfiles: Story = {};

export const OneProfile: Story = {
  args: { candidates: [{ path: '/home/dev/.claude', repositoryCount: 1, lastSessionAt: null }] },
};

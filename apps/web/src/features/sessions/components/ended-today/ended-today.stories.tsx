import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SESSIONS } from '../../fixtures';
import { EndedToday } from './ended-today';

const ended = STORY_SESSIONS.map((session) => ({ ...session, state: 'ended' as const }));

const meta = {
  title: 'Features/Sessions/EndedToday',
  component: EndedToday,
  parameters: { layout: 'padded' },
  args: { sessions: ended, project: 'labo-ia' },
} satisfies Meta<typeof EndedToday>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InAProject: Story = {};

export const MoreInTheHistory: Story = {
  args: { project: null, sessions: [...ended, ...ended.map((session) => ({ ...session, id: `${session.id}-2` }))] },
};

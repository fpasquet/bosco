import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { SessionDto } from '@bosco/domain';
import { STORY_WAITING } from '../../fixtures';
import { PermissionCard } from './permission-card';

const asking = STORY_WAITING[1] as SessionDto;

const meta = {
  title: 'Features/Sessions/PermissionCard',
  component: PermissionCard,
  parameters: { layout: 'padded' },
  args: {
    session: STORY_WAITING[1] ?? STORY_WAITING[0],
    agentSays: 'Je lance la migration de la base de test pour vérifier le schéma des tâches.',
    busy: false,
    now: new Date(),
    settlement: null,
    onAllow: fn(),
    onDeny: fn(),
  },
} satisfies Meta<typeof PermissionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Asked: Story = {};

export const AnsweredElsewhere: Story = {
  args: {
    session: { ...asking, state: 'running', waiting: null },
    settlement: { outcome: 'elsewhere', at: new Date().toISOString() },
  },
};

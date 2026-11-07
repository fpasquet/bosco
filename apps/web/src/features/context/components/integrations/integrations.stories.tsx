import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Integrations } from './integrations';

const at = (time: string) => new Date(`2026-11-06T${time}:00`).toISOString();

const meta = {
  title: 'Features/Context/Integrations',
  component: Integrations,
  parameters: { layout: 'padded' },
  args: {
    integrations: [
      {
        name: 'github',
        address: 'github.com',
        state: 'connected',
        links: 12,
        checkedAt: at('15:00'),
        error: null,
        failingSince: null,
      },
      {
        name: 'jira',
        address: 'https://equipe.atlassian.net',
        state: 'connected',
        links: 5,
        checkedAt: at('15:00'),
        error: null,
        failingSince: null,
      },
      {
        name: 'confluence',
        address: 'https://equipe.atlassian.net/wiki',
        state: 'error',
        links: 3,
        checkedAt: at('15:00'),
        error: 'Jeton refusé ou expiré',
        failingSince: at('11:02'),
      },
    ],
    lastRefresh: at('15:00'),
    nextRefresh: at('16:00'),
    busy: false,
    error: null,
    onConfigure: fn(),
    onRefresh: fn(),
  },
} satisfies Meta<typeof Integrations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneInError: Story = {};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

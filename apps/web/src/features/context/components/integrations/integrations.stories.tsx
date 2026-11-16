import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { IntegrationDto } from '@bosco/domain';
import { Integrations } from './integrations';

const at = (time: string) => new Date(`2026-11-06T${time}:00`).toISOString();

const github: IntegrationDto = {
  name: 'github',
  address: 'github.com',
  state: 'connected',
  links: 12,
  checkedAt: at('15:00'),
  error: null,
  failingSince: null,
};

const atlassian: IntegrationDto = {
  name: 'atlassian',
  address: '*.atlassian.net',
  state: 'agents',
  links: 8,
  checkedAt: null,
  error: null,
  failingSince: null,
};

const meta = {
  title: 'Features/Context/Integrations',
  component: Integrations,
  parameters: { layout: 'padded' },
  args: {
    integrations: [github, atlassian],
    lastRefresh: at('15:00'),
    nextRefresh: at('16:00'),
    busy: false,
    onRefresh: fn(),
  },
} satisfies Meta<typeof Integrations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const GithubInError: Story = {
  args: {
    integrations: [
      { ...github, state: 'error', error: 'GitHub CLI n’est pas connecté', failingSince: at('11:02') },
      atlassian,
    ],
  },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

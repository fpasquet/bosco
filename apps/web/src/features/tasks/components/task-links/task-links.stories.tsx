import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { LinkDto } from '@bosco/domain';
import { TaskLinks } from './task-links';

const link = (overrides: Partial<LinkDto> & Pick<LinkDto, 'id' | 'service' | 'title' | 'url'>): LinkDto => ({
  taskId: 12,
  kind: 'Ticket',
  state: null,
  person: null,
  readAt: new Date('2026-11-06T15:00:00').toISOString(),
  error: null,
  ...overrides,
});

const meta = {
  title: 'Features/Tasks/TaskLinks',
  component: TaskLinks,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    taskId: 12,
    links: [
      link({
        id: 1,
        service: 'decision',
        kind: 'Décision',
        title: 'DEC-3 · Prononcer les sigles lettre par lettre',
        url: 'DEC-3',
        state: 'Acceptée',
      }),
      link({
        id: 2,
        service: 'jira',
        title: 'TTS-142 · Prononciation des sigles',
        url: 'https://equipe.atlassian.net/browse/TTS-142',
        state: 'En cours',
        person: 'Alex M.',
      }),
      link({
        id: 3,
        service: 'confluence',
        kind: 'Page',
        title: 'Lexique de prononciation',
        url: 'https://equipe.atlassian.net/wiki/spaces/TTS/pages/12',
        state: 'v12',
        error: 'Jeton refusé ou expiré',
      }),
    ],
    recognized: { kind: 'Pull request', service: 'github' },
    busy: false,
    error: null,
    onAdd: fn(),
    onRemove: fn(),
    onUrlChange: fn(),
  },
} satisfies Meta<typeof TaskLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeLinks: Story = {};

export const Empty: Story = { args: { links: [] } };

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

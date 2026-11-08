import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { IsolationEgress } from './isolation-egress';

const meta = {
  title: 'Features/Tasks/IsolationEgress',
  component: IsolationEgress,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    isolation: STORY_ISOLATION,
    busy: false,
    error: null,
    now: new Date('2026-11-06T15:30:00'),
    onAdd: fn(),
    onRemove: fn(),
    onSecrets: fn(),
  },
} satisfies Meta<typeof IsolationEgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const NoRefusal: Story = {
  args: { isolation: { ...STORY_ISOLATION, refusals: [], domains: { ...STORY_ISOLATION.domains, added: [] } } },
};

export const InvalidDomain: Story = {
  args: { error: 'Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.' },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

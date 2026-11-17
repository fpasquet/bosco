import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_ISOLATION } from '../../fixtures';
import { IsolationEgress } from './isolation-egress';

const meta = {
  title: 'Features/Sandbox/IsolationEgress',
  component: IsolationEgress,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    isolation: STORY_ISOLATION,
    busy: false,
    error: null,
    onAdd: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof IsolationEgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {};

export const NothingAdded: Story = {
  args: { isolation: { ...STORY_ISOLATION, domains: { ...STORY_ISOLATION.domains, added: [] } } },
};

export const InvalidDomain: Story = {
  args: { error: 'Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.' },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

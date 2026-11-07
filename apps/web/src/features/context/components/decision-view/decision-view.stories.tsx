import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_DEC3, STORY_PROPOSED } from '../../fixtures';
import { DecisionView } from './decision-view';

const meta = {
  title: 'Features/Context/DecisionView',
  component: DecisionView,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    detail: { decision: STORY_PROPOSED, replacedBy: null, specifiedBy: [] },
    now: new Date('2026-11-06T15:30:00'),
    targetLabel: 'api-voix',
    parent: { href: '/context?repository=api-voix', label: 'Contexte › api-voix' },
    busy: false,
    onAccept: fn(),
    onRefuse: fn(),
    onAbandon: fn(),
  },
} satisfies Meta<typeof DecisionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Proposed: Story = {};

export const AcceptedWithVersions: Story = {
  args: { detail: { decision: STORY_DEC3, replacedBy: null, specifiedBy: [STORY_PROPOSED] } },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

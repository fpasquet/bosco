import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { OverviewHeader } from './overview-header';

const meta = {
  title: 'Features/Sessions/OverviewHeader',
  component: OverviewHeader,
  parameters: { layout: 'padded' },
  args: {
    title: 'Vue d’ensemble',
    now: new Date(),
    grouping: 'project',
    hideInactive: false,
    query: '',
    project: null,
    costToday: '6,14 $',
    onGroupingChange: fn(),
    onHideInactiveChange: fn(),
    onQueryChange: fn(),
  },
} satisfies Meta<typeof OverviewHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ByProject: Story = {};

export const FilteredByProject: Story = { args: { project: 'labo-ia' } };

export const ByState: Story = {
  args: { grouping: 'state', summary: '4 sessions ouvertes · 14 aujourd’hui · 6,14 $ estimés' },
};

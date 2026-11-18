import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { allProjectsGroup, clubsGroup } from '../../fixtures';
import { GroupMenu } from '../group-menu';
import { GroupHeader } from './group-header';

const meta = {
  title: 'Features/Projects/GroupHeader',
  component: GroupHeader,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    group: clubsGroup,
    tab: 'sessions',
    menu: <GroupMenu variant="header" group={clubsGroup} onDelete={fn()} onSidebar={fn()} />,
  },
} satisfies Meta<typeof GroupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sessions: Story = {};

export const Instructions: Story = { args: { tab: 'instructions' } };

export const Settings: Story = { args: { tab: 'settings' } };

/** « Tous les projets » n'a que l'onglet Instructions. */
export const AllProjects: Story = { args: { group: allProjectsGroup, tab: 'instructions' } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { allProjectsGroup, clubsGroup } from '../../fixtures';
import { GroupHeader } from './group-header';

const meta = {
  title: 'Features/Projects/GroupHeader',
  component: GroupHeader,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { group: clubsGroup, tab: 'instructions' },
} satisfies Meta<typeof GroupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Instructions: Story = {};

export const Settings: Story = { args: { tab: 'settings' } };

/** « Tous les projets » n'a que l'onglet Instructions. */
export const AllProjects: Story = { args: { group: allProjectsGroup } };

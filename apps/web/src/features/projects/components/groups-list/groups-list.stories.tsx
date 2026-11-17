import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { allProjectsGroup, storyGroups } from '../../fixtures';
import { GroupsList } from './groups-list';

const meta = {
  title: 'Features/Projects/GroupsList',
  component: GroupsList,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { groups: storyGroups },
} satisfies Meta<typeof GroupsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Trois groupes, dont un masqué de la barre latérale, puis « Tous les projets ». */
export const Default: Story = {};

/** Aucun groupe encore : « Tous les projets » reste. */
export const Empty: Story = { args: { groups: [allProjectsGroup] } };

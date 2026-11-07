import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_SOCLES } from '../../fixtures';
import { SoclesList } from './socles-list';

const meta = {
  title: 'Features/Context/SoclesList',
  component: SoclesList,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { socles: STORY_SOCLES },
} satisfies Meta<typeof SoclesList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CommonAndNode: Story = {};

export const Empty: Story = { args: { socles: [] } };

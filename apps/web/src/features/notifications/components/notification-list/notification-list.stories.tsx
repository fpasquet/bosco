import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_NOTIFICATIONS, STORY_NOW } from '../../fixtures';
import { NotificationList } from './notification-list';

const meta = {
  title: 'Features/Notifications/NotificationList',
  component: NotificationList,
  parameters: { layout: 'padded' },
  args: {
    notifications: STORY_NOTIFICATIONS,
    now: STORY_NOW,
    filter: 'all',
    busy: false,
    onFilter: fn(),
    onOpen: fn(),
    onAnswer: fn(),
  },
} satisfies Meta<typeof NotificationList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Toutes les notifications de la journée et de la veille (E15a). */
export const All: Story = {};

/** « À traiter » : ce qui attend encore une réponse ou une relecture. */
export const ToHandle: Story = { args: { filter: 'to-handle' } };

export const Empty: Story = { args: { notifications: [], filter: 'to-handle' } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_NOTIFICATIONS, STORY_NOW } from '../../fixtures';
import { NotificationsDrawer } from './notifications-drawer';

const meta = {
  title: 'Features/Notifications/NotificationsDrawer',
  component: NotificationsDrawer,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    unread: 2,
    notifications: STORY_NOTIFICATIONS,
    now: STORY_NOW,
    filter: 'all',
    busy: false,
    onClose: fn(),
    onReadAll: fn(),
    onFilter: fn(),
    onOpen: fn(),
    onAnswer: fn(),
  },
} satisfies Meta<typeof NotificationsDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Le tiroir ouvert depuis la cloche (E15a). */
export const Open: Story = {};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_NOTIFICATION_SETTINGS } from '../../fixtures';
import { NotificationSettings } from './notification-settings';

const meta = {
  title: 'Features/Notifications/NotificationSettings',
  component: NotificationSettings,
  parameters: { layout: 'padded' },
  args: { settings: STORY_NOTIFICATION_SETTINGS, desktop: true, busy: false, onChange: fn() },
} satisfies Meta<typeof NotificationSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Réglages par défaut (E15b) : les questions et les tâches, les fins de tour après 2 min. */
export const Defaults: Story = {};

export const EveryTurn: Story = { args: { settings: { ...STORY_NOTIFICATION_SETTINGS, turn: 'always', ended: true } } };

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

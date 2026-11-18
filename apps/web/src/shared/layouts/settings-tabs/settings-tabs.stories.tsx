import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SettingsHeader } from './settings-tabs';

const meta = {
  title: 'Layouts/SettingsHeader',
  component: SettingsHeader,
  parameters: { layout: 'padded' },
  args: { current: 'sources' },
} satisfies Meta<typeof SettingsHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sources: Story = {};

export const Notifications: Story = { args: { current: 'notifications' } };

/** Sur le téléphone, la racine des Réglages liste les autres onglets, puis les conteneurs en cours. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

/** Un onglet poussé sur le téléphone : le fil devient le retour aux Réglages. */
export const MobileTab: Story = { args: { current: 'sandbox' }, globals: { viewport: { value: 'mobile1' } } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AppShell } from './app-shell';

const meta = {
  title: 'Layouts/AppShell',
  component: AppShell,
  args: {
    title: 'Vue d’ensemble',
    children: <div className="px-8 pt-6 font-display text-2xl font-semibold">Vue d’ensemble</div>,
  },
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true, navigation: { pathname: '/' } } },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

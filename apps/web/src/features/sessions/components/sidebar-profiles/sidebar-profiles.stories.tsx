import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SidebarProfiles } from './sidebar-profiles';

const meta = {
  title: 'Features/Sessions/Sidebar/SidebarProfiles',
  component: SidebarProfiles,
  decorators: [
    (Story) => (
      <aside className="flex w-60 flex-col bg-nav px-3 py-4 text-sm text-nav-muted">
        <Story />
      </aside>
    ),
  ],
  args: {
    profiles: [
      { label: 'pro', path: '~/.claude', count: 3 },
      { label: 'perso', path: '~/.claude-perso', count: 1 },
    ],
  },
} satisfies Meta<typeof SidebarProfiles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

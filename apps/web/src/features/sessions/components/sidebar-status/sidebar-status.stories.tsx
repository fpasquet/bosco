import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SidebarStatus } from './sidebar-status';

const meta = {
  title: 'Features/Sessions/Sidebar/SidebarStatus',
  component: SidebarStatus,
  decorators: [
    (Story) => (
      <aside className="flex w-60 flex-col bg-nav px-3 py-4 text-sm text-nav-muted">
        <Story />
      </aside>
    ),
  ],
  args: { watched: 2, liveTracking: true },
} satisfies Meta<typeof SidebarStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Le suivi en direct n'est installé dans aucun profil. */
export const WithoutLiveTracking: Story = { args: { watched: 1, liveTracking: false } };

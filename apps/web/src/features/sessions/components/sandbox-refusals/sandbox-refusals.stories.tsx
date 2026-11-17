import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SandboxRefusals } from './sandbox-refusals';

const meta = {
  title: 'Features/Sessions/SandboxRefusals',
  component: SandboxRefusals,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    project: { id: 1, name: 'labo-ia' },
    refusals: [
      { at: '2026-11-06T15:07:00.000Z', host: 'raw.githubusercontent.com' },
      { at: '2026-11-06T15:08:00.000Z', host: 'raw.githubusercontent.com' },
    ],
  },
} satisfies Meta<typeof SandboxRefusals>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Session hors projet : seule la liste générale reçoit le domaine. */
export const WithoutProject: Story = { args: { project: null } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SocleImpactDialog } from './socle-impact-dialog';

const meta = {
  title: 'Features/Context/SocleImpactDialog',
  component: SocleImpactDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true, busy: false, count: 12, socle: 'Socle Node.js', onCancel: fn(), onConfirm: fn() },
} satisfies Meta<typeof SocleImpactDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Un socle partagé par 12 dépôts (E14a, annotation 4). */
export const TwelveRepositories: Story = {};

export const OneRepository: Story = { args: { count: 1, socle: 'Socle NestJS' } };

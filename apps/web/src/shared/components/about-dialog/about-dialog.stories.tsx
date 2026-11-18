import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AboutDialog } from './about-dialog';

const meta = {
  title: 'Shared/AboutDialog',
  component: AboutDialog,
  parameters: { docs: { story: { inline: false, height: '520px' } } },
  args: { open: true, onClose: fn() },
} satisfies Meta<typeof AboutDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ouvert depuis le logo : le texte de bienvenue, puis l'origine du nom. */
export const Default: Story = {};

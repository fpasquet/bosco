import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { UpdateBanner } from './update-banner';

const meta = {
  title: 'Features/About/UpdateBanner',
  component: UpdateBanner,
  args: { notice: { kind: 'installed', version: '0.3.0' }, onDismiss: fn() },
} satisfies Meta<typeof UpdateBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Une fois après une mise à jour. */
export const Installed: Story = {};

/** Une version plus récente est publiée, avec le paquet à télécharger. */
export const Available: Story = {
  args: {
    notice: {
      kind: 'available',
      version: '0.3.0',
      download: {
        label: 'Télécharger le .deb',
        url: 'https://github.com/fpasquet/bosco/releases/download/v0.3.0/x.deb',
      },
    },
  },
};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

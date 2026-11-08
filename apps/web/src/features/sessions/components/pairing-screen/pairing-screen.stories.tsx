import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PairingScreen } from './pairing-screen';

const meta = {
  title: 'Features/Sessions/PairingScreen',
  component: PairingScreen,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
} satisfies Meta<typeof PairingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnterTheCode: Story = {};

/** Le champ ne garde que 6 chiffres : l'espace d'un code collé et un septième chiffre sont écartés. */
export const SixDigitsOnly: Story = {
  play: async ({ canvasElement }) => {
    const field = within(canvasElement).getByLabelText('Code à 6 chiffres');
    await userEvent.type(field, '482 9137');
    await expect(field).toHaveValue('482913');
    await expect(within(canvasElement).getByRole('button', { name: 'Appairer' })).toBeEnabled();
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './select';

/** Liste déroulante de Radix : bouton `select` de daisyUI, liste rangée par groupes, un badge après le texte. */
function Example({ size }: { size?: 'md' | 'sm' }) {
  return (
    <Select defaultValue="pro">
      <SelectTrigger size={size} aria-label="Profil">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pro">
          pro <span className="badge badge-soft badge-sm badge-primary">par défaut</span>
        </SelectItem>
        <SelectGroup>
          <SelectLabel>Autres profils</SelectLabel>
          <SelectItem value="perso">perso</SelectItem>
          <SelectItem value="ultra" disabled>
            ultra
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

const meta = {
  title: 'UI/Forms/Select',
  component: Example,
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

/**
 * Ouverte : l'option choisie cochée, une option grisée. Radix masque le reste de la page (aria-hidden) tant que la liste
 * est ouverte, bouton compris : la règle aria-hidden-focus ne vaut pas pour cet état, le reste de l'audit si.
 */
export const Open: Story = {
  parameters: { a11y: { config: { rules: [{ id: 'aria-hidden-focus', enabled: false }] } } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Profil' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('option', { name: /pro/ })).toHaveAttribute('aria-selected', 'true');
  },
};

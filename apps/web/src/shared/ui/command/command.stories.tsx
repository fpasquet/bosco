import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '.';

/** Liste filtrée par une recherche, rangée par groupes, la ligne choisie cochée. */
function Example() {
  return (
    <Command label="Profils" className="w-72 rounded-card border border-line">
      <CommandInput placeholder="Rechercher un profil" />
      <CommandEmpty>Aucun profil à ce nom.</CommandEmpty>
      <CommandList>
        <CommandGroup heading="Surveillés">
          <CommandItem value="pro" checked>
            pro
          </CommandItem>
          <CommandItem value="perso" checked={false}>
            perso
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="En pause">
          <CommandItem value="ultra" checked={false} disabled>
            ultra
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

const meta = {
  title: 'UI/Forms/Command',
  component: Example,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** La recherche ne garde que les lignes qui la contiennent. */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox'), 'per');
    await expect(canvas.getByRole('option', { name: 'perso' })).toBeInTheDocument();
    await expect(canvas.queryByRole('option', { name: 'pro' })).not.toBeInTheDocument();
  },
};

/** Rien ne correspond : la liste le dit. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox'), 'zzz');
    await expect(canvas.getByText('Aucun profil à ce nom.')).toBeInTheDocument();
  },
};

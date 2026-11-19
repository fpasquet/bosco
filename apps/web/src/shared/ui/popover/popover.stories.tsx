import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '.';

/** Calque flottant ouvert par un bouton, sans masquer le reste de la page (modal={false}). */
function Example() {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button type="button" className="btn btn-outline btn-sm">
          Détails
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-labelledby="popover-title">
        <PopoverHeader>
          <PopoverTitle id="popover-title">api-tarifs</PopoverTitle>
          <PopoverDescription>~/www/api-tarifs · develop · 2 fichiers modifiés</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

const meta = {
  title: 'UI/Overlays/Popover',
  component: Example,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Détails' }));
    await expect(await within(canvasElement.ownerDocument.body).findByText('api-tarifs')).toBeInTheDocument();
  },
};

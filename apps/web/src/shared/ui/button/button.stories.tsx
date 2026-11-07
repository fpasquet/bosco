import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArrowRight, Ellipsis } from 'lucide-react';
import { Button } from './button';

// Modèle d'histoire : textes et données du fil rouge du produit, une histoire par état ou par famille de variantes.
const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Autoriser', variant: 'primary', size: 'default' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outline', 'secondary', 'ghost', 'destructive', 'link'] },
    size: { control: 'select', options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Rend les classes de daisyUI `btn` + `btn-<variante>` + `btn-<taille>` (`destructive` : `btn-error`, `icon` : `btn-square`).',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} variant="primary">
        Autoriser
      </Button>
      <Button {...args} variant="outline">
        Copier la reprise
      </Button>
      <Button {...args} variant="secondary">
        Voir la session
      </Button>
      <Button {...args} variant="ghost">
        Plus tard
      </Button>
      <Button {...args} variant="destructive">
        Annuler la tâche
      </Button>
      <Button {...args} variant="link">
        Voir les droits
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button {...args} size="xs">
        Très petit
      </Button>
      <Button {...args} size="sm">
        Petit
      </Button>
      <Button {...args}>Normal</Button>
      <Button {...args} size="lg">
        Grand (mobile)
      </Button>
      <Button {...args} variant="secondary" size="icon" aria-label="Actions">
        <Ellipsis aria-hidden />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Button {...args}>
      Voir le diff
      <ArrowRight aria-hidden />
    </Button>
  ),
};

export const Disabled: Story = { args: { disabled: true, children: 'Nouvelle tâche' } };

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#suite">Voir la suite</a>
    </Button>
  ),
};

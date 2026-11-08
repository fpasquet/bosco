import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Bubble, BubbleContent, BubbleGroup } from './index';

const VARIANTS = ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'] as const;

const meta = {
  title: 'UI/Bubble',
  component: Bubble,
  parameters: {
    docs: {
      description: {
        component: 'Bulle d’un message (shadcn) : `bubble-<variante>`, `bubble-end` pour l’aligner à droite.',
      },
    },
  },
} satisfies Meta<typeof Bubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <BubbleGroup className="max-w-md">
      {VARIANTS.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant} · Je relis le découpage des PDF.</BubbleContent>
        </Bubble>
      ))}
      <Bubble variant="tinted" align="end">
        <BubbleContent asChild>
          <button type="button">Bulle cliquable, alignée à droite</button>
        </BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
};

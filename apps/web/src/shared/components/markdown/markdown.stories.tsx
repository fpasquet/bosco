import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Markdown } from './markdown';

const meta = {
  title: 'Shared/Markdown',
  component: Markdown,
  args: {
    children: [
      '## Import des ingrédients',
      'L’import sépare une **quantité** de son ingrédient. Je recolle les lignes avec `joinQuantities` :',
      '```ts\nfor (const line of joinQuantities(lines)) ingredients.push(...splitLine(line));\n```',
      '- `tarte-aux-pommes.md` : 2 quantités coupées\n- `gratin.md` : 1 quantité coupée',
      '| Recette | Quantités coupées |\n| --- | --- |\n| `tarte-aux-pommes.md` | 2 |\n| `gratin.md` | 1 |',
      '> Le test de la quantité sur deux lignes échoue encore.',
      'Voir la [description d’une recette](https://schema.org/Recipe).',
    ].join('\n\n'),
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reply: Story = {};

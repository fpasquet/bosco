import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Markdown } from './markdown';

const meta = {
  title: 'Shared/Markdown',
  component: Markdown,
  args: {
    children: [
      '## Découpage des PDF',
      'Le découpage coupe au milieu des **tableaux**. Je regroupe les lignes d’un même tableau avec `groupTables` :',
      '```ts\nchunks.push(...splitBlocks(groupTables(page.blocks)));\n```',
      '- `devis.pdf` : 2 tableaux\n- `facture.pdf` : 1 tableau',
      '| Fichier | Tableaux |\n| --- | --- |\n| `devis.pdf` | 2 |\n| `facture.pdf` | 1 |',
      '> Le test du tableau sur deux pages échoue encore.',
      'Voir la [documentation de pdf.js](https://mozilla.github.io/pdf.js/).',
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

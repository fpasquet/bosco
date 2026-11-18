import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SearchResults } from './search-results';

const meta = {
  title: 'Features/Sessions/SearchResults',
  component: SearchResults,
  args: {
    links: [
      { title: 'Schema.org Recipe', url: 'https://schema.org/Recipe' },
      { title: 'Ingredient phrase tagger', url: 'https://github.com/nytimes/ingredient-phrase-tagger' },
      { title: 'recipe-ingredient-parser', url: 'https://www.npmjs.com/package/recipe-ingredient-parser-v3' },
    ],
  },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hosts: Story = {};

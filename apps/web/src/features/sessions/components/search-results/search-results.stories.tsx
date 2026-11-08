import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SearchResults } from './search-results';

const meta = {
  title: 'Features/Sessions/SearchResults',
  component: SearchResults,
  args: {
    links: [
      { title: 'PDF.js', url: 'https://mozilla.github.io/pdf.js/' },
      { title: 'Extracting tables from PDFs', url: 'https://github.com/mozilla/pdf.js/discussions/17000' },
      { title: 'pdfplumber tables', url: 'https://pypi.org/project/pdfplumber/' },
    ],
  },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hosts: Story = {};

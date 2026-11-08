import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HighlightedCode } from './highlighted-code';

const meta = {
  title: 'Shared/HighlightedCode',
  component: HighlightedCode,
  args: {
    code: 'export function chunkPdf(pages: Page[]): Chunk[] {\n  return pages.flatMap((page) => splitBlocks(page.blocks));\n}',
    language: 'typescript',
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HighlightedCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Floating: Story = {};

export const WithTitle: Story = { args: { title: 'src/indexer/pdf.ts' } };

export const Diff: Story = {
  args: {
    code: '  for (const page of pages) chunks.push(...splitBlocks(page.blocks));\n  for (const page of pages) chunks.push(...splitBlocks(groupTables(page.blocks)));',
    size: 'sm',
    variants: ['removed', 'added'],
  },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HighlightedCode } from './highlighted-code';

const meta = {
  title: 'Shared/HighlightedCode',
  component: HighlightedCode,
  args: {
    code: 'export function parseIngredients(lines: string[]): Ingredient[] {\n  return joinQuantities(lines).flatMap((line) => splitLine(line));\n}',
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

export const WithTitle: Story = { args: { title: 'src/import/ingredients.ts' } };

export const Diff: Story = {
  args: {
    code: '  for (const line of lines) ingredients.push(...splitLine(line));\n  for (const line of joinQuantities(lines)) ingredients.push(...splitLine(line));',
    size: 'sm',
    variants: ['removed', 'added'],
  },
};

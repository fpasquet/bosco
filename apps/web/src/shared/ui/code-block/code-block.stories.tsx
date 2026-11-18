import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FileCodeIcon } from 'lucide-react';
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from './index';

const CODE =
  'export function parseIngredients(lines: string[]): Ingredient[] {\n  return joinQuantities(lines).flatMap((line) => splitLine(line));\n}';

const meta = {
  title: 'UI/CodeBlock',
  component: CodeBlock,
  parameters: {
    docs: {
      description: {
        component:
          'Code, commandes et sorties (shadcn). Modificateurs : `code-block-sm`, `code-block-content-wrap`, `code-block-content-numbered` ; lignes `code-block-line-added`, `-removed`, `-highlighted`.',
      },
    },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeader: Story = {
  render: () => (
    <CodeBlock className="max-w-lg">
      <CodeBlockHeader>
        <CodeBlockTitle>
          <FileCodeIcon />
          src/import/ingredients.ts
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={CODE} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{CODE}</CodeBlockContent>
    </CodeBlock>
  ),
};

export const Diff: Story = {
  render: () => (
    <CodeBlock size="sm" className="max-w-lg">
      <CodeBlockContent>
        <CodeBlockLine variant="removed">
          {'  for (const line of lines) ingredients.push(...splitLine(line));'}
        </CodeBlockLine>
        <CodeBlockLine variant="added">
          {'  for (const line of joinQuantities(lines)) ingredients.push(...splitLine(line));'}
        </CodeBlockLine>
        <CodeBlockLine>{'  return ingredients;'}</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>
  ),
};

export const Destructive: Story = {
  render: () => (
    <CodeBlock variant="destructive" size="sm" className="max-w-lg">
      <CodeBlockContent wrap>{"TypeError: Cannot read properties of undefined (reading 'rows')"}</CodeBlockContent>
    </CodeBlock>
  ),
};

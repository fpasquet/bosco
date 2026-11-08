import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TerminalOutput } from './terminal-output';

const meta = {
  title: 'Shared/TerminalOutput',
  component: TerminalOutput,
  args: { command: 'yarn lint && echo "lint ok"', output: 'yarn run v1.22.22\n$ eslint src\nDone in 2.84s.' },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TerminalOutput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Output: Story = {};

export const AnsiColours: Story = {
  args: {
    command: 'pnpm test',
    output: '\u001b[32m✓\u001b[39m keeps a table in one chunk\n\u001b[31m×\u001b[39m splits a long table across pages',
  },
};

export const Empty: Story = { args: { output: '' } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BrainIcon, FileTextIcon, TerminalIcon } from 'lucide-react';
import { CodeBlock, CodeBlockContent } from '@/shared/ui/code-block';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from './index';

const meta = {
  title: 'UI/Trace',
  component: Trace,
  parameters: {
    docs: {
      description: {
        component:
          'Étapes d’un agent (shadcn, AI Elements) : une ligne par étape, dépliable sur son détail. État : `status` → `trace-line-running`, `trace-line-error`, `trace-line-pending`.',
      },
    },
  },
} satisfies Meta<typeof Trace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lines: Story = {
  render: () => (
    <Trace className="max-w-md">
      <TraceLine>
        <TraceIcon>
          <FileTextIcon />
        </TraceIcon>
        <TraceTitle>A lu src/indexer/pdf.ts</TraceTitle>
        <TraceDescription>1 s</TraceDescription>
      </TraceLine>
      <TraceLine status="running">
        <TraceIcon>
          <TerminalIcon />
        </TraceIcon>
        <TraceTitle>Lance yarn test --forceExit</TraceTitle>
      </TraceLine>
      <TraceLine status="error">
        <TraceIcon>
          <TerminalIcon />
        </TraceIcon>
        <TraceTitle>yarn lint a échoué</TraceTitle>
      </TraceLine>
      <TraceLine status="pending">
        <TraceIcon>
          <TerminalIcon />
        </TraceIcon>
        <TraceTitle>Relancer toute la suite</TraceTitle>
      </TraceLine>
    </Trace>
  ),
};

export const Open: Story = {
  render: () => (
    <Trace className="max-w-md">
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <BrainIcon />
            </TraceIcon>
            <TraceTitle>A réfléchi</TraceTitle>
            <TraceDescription>4 s</TraceDescription>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          Le découpage travaille bloc par bloc : un tableau est coupé entre deux blocs.
        </TraceCollapsibleContent>
      </TraceCollapsible>
      <TraceCollapsible defaultOpen>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <TerminalIcon />
            </TraceIcon>
            <TraceTitle>A lancé yarn lint</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <CodeBlock size="sm">
            <CodeBlockContent wrap>{'$ eslint src\nDone in 2.84s.'}</CodeBlockContent>
          </CodeBlock>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  ),
};

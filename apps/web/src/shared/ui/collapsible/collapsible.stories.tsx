import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  parameters: {
    docs: { description: { component: 'Primitive Radix sans classe, sous Trace : un contenu qui se déplie.' } },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="btn btn-ghost btn-sm">Sortie de yarn lint</CollapsibleTrigger>
      <CollapsibleContent className="pt-2 font-mono text-xs">Done in 2.84s.</CollapsibleContent>
    </Collapsible>
  ),
};

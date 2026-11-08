import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Bubble, BubbleContent } from '@/shared/ui/bubble';
import { Message, MessageContent, MessageHeader } from './index';

const meta = {
  title: 'UI/Message',
  component: Message,
  parameters: {
    docs: {
      description: {
        component: 'Un tour de la conversation (shadcn, AI Elements) : `message-end` l’aligne à droite.',
      },
    },
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Turns: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <MessageHeader>Toi · 14:02</MessageHeader>
          <Bubble variant="tinted">
            <BubbleContent>Les PDF avec des tableaux sont coupés au mauvais endroit.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message>
        <MessageContent>
          <MessageHeader className="px-0">Agent · 14:03</MessageHeader>
          <p>Je relis le découpage des PDF, puis j’écris un test avec un tableau.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

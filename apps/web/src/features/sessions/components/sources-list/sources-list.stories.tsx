import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SourcesList } from './sources-list';

const meta = {
  title: 'Features/Sessions/SourcesList',
  component: SourcesList,
  args: {
    sources: [
      { title: null, url: 'https://schema.org/Recipe' },
      { title: 'Ingredient phrase tagger', url: 'https://github.com/nytimes/ingredient-phrase-tagger' },
    ],
  },
} satisfies Meta<typeof SourcesList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /2 sources/ }));
    await expect(canvas.getByRole('link', { name: /Ingredient phrase tagger/ })).toBeVisible();
  },
};

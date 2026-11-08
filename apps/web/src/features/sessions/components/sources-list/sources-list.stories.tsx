import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SourcesList } from './sources-list';

const meta = {
  title: 'Features/Sessions/SourcesList',
  component: SourcesList,
  args: {
    sources: [
      { title: null, url: 'https://mozilla.github.io/pdf.js/' },
      { title: 'Extracting tables from PDFs', url: 'https://github.com/mozilla/pdf.js/discussions/17000' },
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
    await expect(canvas.getByRole('link', { name: /Extracting tables from PDFs/ })).toBeVisible();
  },
};

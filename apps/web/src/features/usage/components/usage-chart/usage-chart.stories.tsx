import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { STORY_DAYS, STORY_USAGE_EMPTY } from '../../fixtures';
import { UsageChart, UsageLegend, UsageTable } from './usage-chart';

const meta = {
  title: 'Features/Usage/Charts/UsageChart',
  component: UsageChart,
  parameters: { layout: 'padded' },
  args: { days: STORY_DAYS, measure: 'tokens', today: '2026-11-17' },
  decorators: [
    (Story) => (
      <div className="flex max-w-4xl flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <UsageLegend />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UsageChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 30 jours : l'axe en millions de tokens, le total sur le pic (6 nov.) et sur le jour en cours. */
export const Default: Story = {};

/** « Coût estimé » remplace les tokens sur le même axe unique. */
export const Cost: Story = { args: { measure: 'cost' } };

/** Au focus d'un jour, les autres s'estompent et l'info-bulle détaille ses quatre séries. */
export const Focused: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('tooltip')).toHaveTextContent('Lecture du cache');
  },
};

/** Sur le téléphone : les 7 derniers jours, une barre lisible par jour. */
export const Mobile: Story = {
  args: { days: STORY_DAYS.slice(-7), compact: true },
  globals: { viewport: { value: 'mobile1' } },
};

export const Empty: Story = { args: { days: STORY_USAGE_EMPTY.days } };

/** Vue en tableau : les mêmes données, une ligne par jour. */
export const Table: Story = {
  render: (args) => <UsageTable days={args.days.slice(-7)} today={args.today} />,
};

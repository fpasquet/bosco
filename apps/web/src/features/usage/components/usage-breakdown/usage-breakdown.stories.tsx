import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { STORY_USAGE, STORY_USAGE_GROUP, STORY_USAGE_UNPRICED } from '../../fixtures';
import { UsageBreakdown } from './usage-breakdown';

const meta = {
  title: 'Features/Usage/Cards/UsageBreakdown',
  component: UsageBreakdown,
  parameters: { layout: 'padded' },
  args: {
    byProject: STORY_USAGE.byProject,
    byModel: STORY_USAGE.byModel,
    byProfile: STORY_USAGE.byProfile,
    byOrigin: STORY_USAGE.byOrigin,
    home: '/home/camille',
    onProject: fn(),
  },
} satisfies Meta<typeof UsageBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tous les projets, les plus gros d'abord, et chaque dossier hors projet : les dix premiers d'emblée, les autres
 * dépliés par « Afficher les N autres » ; un clic sur un projet filtre la page.
 */
export const Default: Story = {};

/** « Afficher les 3 autres » déplie les plus petits projets et dossiers hors projet. */
export const Unfolded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('~/scripts')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Afficher les 3 autres' }));
    await expect(canvas.getByRole('button', { name: /meteo/ })).toBeVisible();
    await expect(canvas.getByText('/tmp')).toBeVisible();
  },
};

/** Groupe Club des Trois Lacs : une session à plusieurs projets compte pour chacun, la somme dépasse 100 %. */
export const Group: Story = { args: { byProject: STORY_USAGE_GROUP.byProject } };

export const Unpriced: Story = { args: { byModel: STORY_USAGE_UNPRICED.byModel } };

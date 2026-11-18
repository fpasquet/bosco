import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
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
    onProject: fn(),
  },
} satisfies Meta<typeof UsageBreakdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Les plus gros d'abord, « 10 autres » regroupés ; un clic sur un projet filtre la page. */
export const Default: Story = {};

/** Groupe Club des Trois Lacs : une session à plusieurs projets compte pour chacun, la somme dépasse 100 %. */
export const Group: Story = { args: { byProject: STORY_USAGE_GROUP.byProject } };

export const Unpriced: Story = { args: { byModel: STORY_USAGE_UNPRICED.byModel } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_USAGE, STORY_USAGE_UNPRICED } from '../../fixtures';
import { TokenTiles } from './token-tiles';

const meta = {
  title: 'Features/Usage/Cards/TokenTiles',
  component: TokenTiles,
  parameters: { layout: 'padded' },
  args: { tokens: STORY_USAGE.tokens },
} satisfies Meta<typeof TokenTiles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Un modèle sans tarif connu : ses tokens comptent, son coût non, et le chiffre le dit. */
export const Unpriced: Story = { args: { tokens: STORY_USAGE_UNPRICED.tokens } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

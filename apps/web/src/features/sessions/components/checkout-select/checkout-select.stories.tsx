import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { CheckoutSelect } from './checkout-select';

const meta = {
  title: 'Features/Sessions/CheckoutSelect',
  component: CheckoutSelect,
  args: {
    ariaLabel: 'Branche ou worktree',
    onChange: fn(),
    value: '',
    options: {
      defaultLabel: 'main · branche active',
      worktrees: [
        { label: 'feat/tarifs · worktree', value: 'worktree:/home/dev/www/site-clubs/.claude/worktrees/tarifs' },
      ],
      branches: [
        { label: 'develop · branche', value: 'branch:develop' },
        { label: 'fix/creneaux · branche', value: 'branch:fix/creneaux' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CheckoutSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** La branche active par défaut, puis les worktrees et les branches, chacun nommé avec son type. */
export const Default: Story = {};

/** Un worktree choisi. */
export const WorktreeChosen: Story = {
  args: { value: 'worktree:/home/dev/www/site-clubs/.claude/worktrees/tarifs' },
};

/** Un dépôt sans autre branche ni worktree : le défaut seul. */
export const ActiveOnly: Story = {
  args: { options: { defaultLabel: 'main · branche active', worktrees: [], branches: [] } },
};

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckoutSelect } from './checkout-select';

const ROOT = '/home/dev/www/site-clubs';

const meta = {
  title: 'Features/Sessions/CheckoutSelect',
  component: CheckoutSelect,
  args: {
    ariaLabel: 'Branche ou worktree',
    onChange: fn(),
    value: 'default',
    options: {
      default: { badge: 'active', label: 'main', value: 'default' },
      worktrees: [
        { hint: '.claude/worktrees/tarifs', label: 'feat/tarifs', value: `worktree:${ROOT}/.claude/worktrees/tarifs` },
        {
          hint: '/home/dev/www/site-clubs-review',
          label: 'détaché',
          value: 'worktree:/home/dev/www/site-clubs-review',
        },
      ],
      branches: [
        { label: 'develop', value: 'branch:develop' },
        { label: 'fix/creneaux', value: 'branch:fix/creneaux' },
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

/** La branche active par défaut, avec son badge. */
export const Default: Story = {};

/** Ouverte : la recherche en tête, le défaut, puis les worktrees avec leur dossier et les branches sous leur groupe. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Branche ou worktree' }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('option', { name: /feat\/tarifs/ })).toBeInTheDocument();
    await expect(body.getByText('Worktrees')).toBeInTheDocument();
  },
};

/** Une recherche ne garde que les branches et les worktrees qui la contiennent, dans leur nom ou leur dossier. */
export const Searched: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox', { name: 'Branche ou worktree' }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByRole('combobox', { name: 'Rechercher une branche ou un worktree' }), 'crene');
    await expect(body.getByRole('option', { name: /fix\/creneaux/ })).toBeInTheDocument();
    await expect(body.queryByRole('option', { name: /develop/ })).not.toBeInTheDocument();
  },
};

/** Un nom de branche long : tronqué, le badge et la flèche restent visibles. */
export const LongName: Story = {
  args: {
    size: 'sm',
    className: 'min-w-64',
    options: {
      default: { badge: 'active', label: 'memory/task-16b7103c-with-a-very-long-branch-name', value: 'default' },
      worktrees: [],
      branches: [],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

/** Un worktree choisi : son icône et son nom. */
export const WorktreeChosen: Story = {
  args: { value: `worktree:${ROOT}/.claude/worktrees/tarifs` },
};

/** En bac à sable, la branche de départ réglée pour le projet passe en tête, la branche active restant un choix. */
export const ProjectStart: Story = {
  args: {
    options: {
      default: { badge: 'départ du projet', label: 'develop', value: 'default' },
      worktrees: [],
      branches: [{ badge: 'active', label: 'main', value: 'branch:main' }],
    },
  },
};

/** Ligne du tableau de plusieurs projets. */
export const Small: Story = { args: { size: 'sm', className: 'w-56' } };

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { PhoneTabs } from './phone-tabs';

const meta = {
  title: 'Features/Sessions/PhoneTabs',
  component: PhoneTabs,
  parameters: { layout: 'padded' },
  args: { current: 'feed', onChange: fn(), tabs: ['feed', 'usage'] },
  // L'onglet ouvert désigne son volet, rendu par l'écran du détail
  render: (args) => (
    <div>
      <PhoneTabs {...args} />
      <p role="tabpanel" id={`session-panel-${args.current}`} aria-labelledby={`session-tab-${args.current}`}>
        Volet de l’onglet ouvert
      </p>
    </div>
  ),
} satisfies Meta<typeof PhoneTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Session à plusieurs projets : l'onglet « Projets » entre le fil et l'usage. */
export const SeveralProjects: Story = { args: { current: 'projects', tabs: ['feed', 'projects', 'usage'] } };

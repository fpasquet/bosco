import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_DEC3, STORY_VITEST } from '../../fixtures';
import { DecisionForm } from './decision-form';

const meta = {
  title: 'Features/Context/DecisionForm',
  component: DecisionForm,
  parameters: { layout: 'padded' },
  args: {
    mode: 'new',
    initial: null,
    targetLabel: 'api-voix',
    exceptionChoices: [STORY_VITEST],
    busy: false,
    serverError: null,
    onCancel: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof DecisionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewDecision: Story = {
  args: { targetChoices: ['api-voix', 'labo-ia', 'outils-node'], onTargetChange: fn() },
};

export const SocleDecision: Story = {
  args: { targetLabel: 'Socle Node.js', exceptionChoices: [] },
};

export const NewVersion: Story = {
  args: { mode: 'edit', initial: STORY_DEC3.versions.at(-1)!, nextVersion: 3, exceptionChoices: [] },
};

export const NoteMissing: Story = {
  args: { ...NewVersion.args, serverError: 'Écris une note pour dire ce qui change.' },
};

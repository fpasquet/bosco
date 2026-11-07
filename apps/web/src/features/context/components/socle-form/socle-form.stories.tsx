import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_SOCLES } from '../../fixtures';
import { SocleForm } from './socle-form';

const meta = {
  title: 'Features/Context/SocleForm',
  component: SocleForm,
  parameters: { layout: 'padded' },
  args: {
    socles: STORY_SOCLES,
    repositories: ['api-signets', 'api-quiz', 'api-voix', 'outils-node'],
    busy: false,
    serverError: null,
    onCancel: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof SocleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewSocle: Story = {};

export const Loop: Story = { args: { serverError: 'Un socle ne peut pas hériter de lui-même, même indirectement.' } };

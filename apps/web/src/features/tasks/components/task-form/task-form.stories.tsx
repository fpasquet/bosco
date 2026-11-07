import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_TASKS } from '../../fixtures';
import { TaskForm } from './task-form';

const meta = {
  title: 'Features/Tasks/TaskForm',
  component: TaskForm,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    issues: [],
    repositories: [
      { name: 'api-voix', root: '/home/dev/api-voix' },
      { name: 'labo-ia', root: '/home/dev/labo-ia' },
    ],
    tasks: STORY_TASKS,
    onCancel: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof TaskForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewTask: Story = {};

export const WithErrors: Story = {
  args: {
    issues: [
      {
        field: 'budgetUsd',
        message:
          'Le budget dépasse le plafond de api-voix : 2,00 $ au plus. Baisse-le, ou relève le plafond dans les droits du dépôt.',
      },
      {
        field: 'tools',
        message: 'WebFetch n’est pas autorisé dans api-voix, qui autorise : Read, Write, Edit, Grep, Glob, Bash.',
      },
      { field: 'prerequisites', message: 'T-9 est en échec : relance-la, ou retire-la des préalables.' },
    ],
  },
};

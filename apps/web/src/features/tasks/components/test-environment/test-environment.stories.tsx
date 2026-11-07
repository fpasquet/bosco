import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_TEST_ENVIRONMENT } from '../../fixtures';
import { TestEnvironment } from './test-environment';

const meta = {
  title: 'Features/Tasks/TestEnvironment',
  component: TestEnvironment,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    environment: STORY_TEST_ENVIRONMENT,
    busy: false,
    error: null,
    now: new Date('2026-11-06T15:30:00'),
    onChange: fn(),
  },
} satisfies Meta<typeof TestEnvironment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Automatic: Story = {};

export const Chosen: Story = {
  args: {
    environment: {
      ...STORY_TEST_ENVIRONMENT,
      mode: 'choose',
      selected: ['database'],
      launched: [{ name: 'database', image: 'mysql:8.0' }],
      excluded: [
        ...STORY_TEST_ENVIRONMENT.excluded,
        { name: 'rabbitmq', reason: 'non coché' },
        { name: 'fake-gcs-server', reason: 'non coché' },
      ],
    },
  },
};

export const ServiceFailed: Story = {
  args: {
    environment: {
      ...STORY_TEST_ENVIRONMENT,
      lastRun: {
        taskId: 13,
        at: new Date('2026-11-06T15:10:00').toISOString(),
        removedAt: null,
        launches: [{ name: 'database', image: 'mysql:8.0', readySeconds: null, error: 'pas prêt après 180 s' }],
      },
    },
  },
};

export const WithoutFile: Story = {
  args: {
    environment: {
      ...STORY_TEST_ENVIRONMENT,
      file: null,
      services: [],
      launched: [],
      excluded: [],
      removed: [],
      lastRun: null,
    },
  },
};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };

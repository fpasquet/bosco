import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { CostReportDto } from '@bosco/domain';
import { CostReport } from './cost-report';

const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toLocaleDateString('sv');
const repo = (name: string, usd: number, sessions = 3) => ({ name, sessions, usd });

const report: CostReportDto = {
  totalUsd: 96.4,
  workingDays: 5,
  averagePerWorkingDayUsd: 19.28,
  sessions: 212,
  cacheShare: 68,
  days: [4, 3, 2, 1, 0].map((offset) => ({
    date: day(offset),
    repositories: [
      repo('labo-ia', 2 + offset / 2),
      repo('outils-node', 1.2),
      repo('api-voix', 0.6),
      repo('scripts', 0.3),
    ],
  })),
  byRepository: [
    { name: 'labo-ia', sessions: 118, usd: 52.1, share: 54 },
    { name: 'outils-node', sessions: 51, usd: 24.85, share: 26 },
    { name: 'api-voix', sessions: 27, usd: 11.3, share: 12 },
    { name: 'scripts', sessions: 16, usd: 8.15, share: 8 },
  ],
  byModel: [
    { model: 'claude-sonnet-5-5', usd: 58.8, share: 61 },
    { model: 'claude-opus-5-5', usd: 35.67, share: 37 },
    { model: 'claude-haiku-5-5', usd: 1.93, share: 2 },
  ],
};

const meta = {
  title: 'Features/Sessions/CostReport',
  component: CostReport,
  parameters: { layout: 'padded' },
  args: { report, now: new Date() },
} satisfies Meta<typeof CostReport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThirtyDays: Story = {};

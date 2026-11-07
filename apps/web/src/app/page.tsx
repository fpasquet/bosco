import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Vue d’ensemble';

export default function OverviewPage() {
  return (
    <AppShell title={TITLE}>
      <div className="px-8 pt-6">
        <h1 className="hidden font-display text-2xl font-semibold md:block">{TITLE}</h1>
      </div>
    </AppShell>
  );
}

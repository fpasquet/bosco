import { OverviewScreen } from '@/features/sessions/components/overview-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Vue d’ensemble';

/** `?project=labo-ia` limite la vue d'ensemble à un projet (E1c). */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project ?? null;
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={project} />}>
      <OverviewScreen project={project} title={TITLE} />
    </AppShell>
  );
}

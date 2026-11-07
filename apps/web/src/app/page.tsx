import { OverviewScreen } from '@/features/sessions/components/overview-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Vue d’ensemble';

/** `?repo=labo-ia` limite la vue d'ensemble à un dépôt (E1c). */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  const repository = (await searchParams).repo ?? null;
  return (
    <AppShell title={TITLE} sidebar={<OverviewSidebar selected={repository} />}>
      <OverviewScreen repository={repository} title={TITLE} />
    </AppShell>
  );
}

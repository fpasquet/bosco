import { ContextScreen } from '@/features/context/components/context-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function ContextPage({ searchParams }: { searchParams: Promise<{ repository?: string }> }) {
  const { repository } = await searchParams;
  return (
    <AppShell title="Contexte" sidebar={<OverviewSidebar selected={null} />}>
      <ContextScreen repository={repository ?? null} />
    </AppShell>
  );
}

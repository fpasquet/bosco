import { NewDecisionScreen } from '@/features/context/components/decision-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Nouvelle décision d'un projet ; `?replaces=6` : elle en remplace une autre. */
export default async function NewDecisionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ replaces?: string }>;
}) {
  const id = Number((await params).id);
  const { replaces } = await searchParams;
  return (
    <AppShell title="Nouvelle décision" place={{ kind: 'project', id }}>
      <NewDecisionScreen projectId={id} replaces={replaces ? Number(replaces) : null} />
    </AppShell>
  );
}

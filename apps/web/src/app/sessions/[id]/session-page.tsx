'use client';
import { SessionDetailScreen } from '@/features/sessions/components/session-detail-screen';
import { useSessionProject } from '@/features/sessions/hooks/use-session-project';
import { AppShell } from '@/shared/layouts/app-shell';

/** Détail d'une session : son projet principal est actif dans la barre latérale, sinon la vue d'ensemble. */
export function SessionPage({ id }: { id: string }) {
  const project = useSessionProject(id);
  return (
    <AppShell title="Session" place={project === null ? { kind: 'overview' } : { kind: 'project', id: project }}>
      <SessionDetailScreen id={id} />
    </AppShell>
  );
}

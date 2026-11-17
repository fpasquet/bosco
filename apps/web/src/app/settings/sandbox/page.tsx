import { IsolationScreen } from '@/features/sandbox/components/isolation-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Bac à sable ; « ?domain= » remplit le champ d'ajout, depuis une sortie refusée d'une session. */
export default async function SandboxSettingsPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const { domain } = await searchParams;
  return (
    <AppShell title="Bac à sable" place={{ kind: 'settings' }}>
      <IsolationScreen domain={domain ?? null} />
    </AppShell>
  );
}

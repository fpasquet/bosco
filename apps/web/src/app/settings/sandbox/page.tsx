import { IsolationScreen } from '@/features/sandbox/components/isolation-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Bac à sable. */
export default function SandboxSettingsPage() {
  return (
    <AppShell title="Bac à sable" place={{ kind: 'settings' }}>
      <IsolationScreen />
    </AppShell>
  );
}

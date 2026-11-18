import { SourcesScreen } from '@/features/sessions/components/sources-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Sources ; la racine des Réglages sur le téléphone. */
export default function SourcesSettingsPage() {
  return (
    <AppShell title="Réglages" place={{ kind: 'settings' }}>
      <SourcesScreen />
    </AppShell>
  );
}

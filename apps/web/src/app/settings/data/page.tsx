import { DataScreen } from '@/features/data/components/data-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Données. */
export default function DataSettingsPage() {
  return (
    <AppShell title="Données" place={{ kind: 'settings' }}>
      <DataScreen />
    </AppShell>
  );
}

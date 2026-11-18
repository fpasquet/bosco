import { AboutScreen } from '@/features/about/components/about-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › À propos. */
export default function AboutSettingsPage() {
  return (
    <AppShell title="À propos" place={{ kind: 'settings' }}>
      <AboutScreen />
    </AppShell>
  );
}

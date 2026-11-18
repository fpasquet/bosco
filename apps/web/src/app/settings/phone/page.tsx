import { PhoneSettingsScreen } from '@/features/sessions/components/phone-access';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Téléphone. */
export default function PhoneSettingsPage() {
  return (
    <AppShell title="Téléphone" place={{ kind: 'settings' }}>
      <PhoneSettingsScreen />
    </AppShell>
  );
}

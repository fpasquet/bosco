import { ProfileSettingsScreen } from '@/features/sessions/components/profile-settings-screen';
import { AppShell } from '@/shared/layouts/app-shell';

/** Réglages › Sources › un profil : ses valeurs par défaut des sessions. */
export default async function ProfileSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Profil" place={{ kind: 'settings' }}>
      <ProfileSettingsScreen id={decodeURIComponent(id)} />
    </AppShell>
  );
}

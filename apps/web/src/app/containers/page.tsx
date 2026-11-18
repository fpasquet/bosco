import { ContainersScreen } from '@/features/sandbox/components/containers-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Conteneurs en cours';

/** Conteneurs en cours sur le téléphone : écran poussé depuis les réglages. */
export default function ContainersPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'settings' }}>
      <ContainersScreen />
    </AppShell>
  );
}

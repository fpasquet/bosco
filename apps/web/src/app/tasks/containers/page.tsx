import { ContainersScreen } from '@/features/tasks/components/containers-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Conteneurs en cours';

/** Conteneurs en cours sur le téléphone (E19a) : écran poussé depuis la ligne du worker de l'onglet Tâches. */
export default function ContainersPage() {
  return (
    <AppShell title={TITLE}>
      <ContainersScreen />
    </AppShell>
  );
}

import { OverviewScreen } from '@/features/sessions/components/overview-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Vue d’ensemble';

export default function OverviewPage() {
  return (
    <AppShell title={TITLE}>
      <OverviewScreen title={TITLE} />
    </AppShell>
  );
}

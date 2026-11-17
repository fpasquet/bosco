import { SourcesScreen } from '@/features/sessions/components/sources-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Sources';

export default function SourcesPage() {
  return (
    <AppShell title={TITLE} place={{ kind: 'settings' }}>
      <SourcesScreen title={TITLE} />
    </AppShell>
  );
}

import { EditSocleScreen } from '@/features/context/components/socles-screen';
import { OverviewSidebar } from '@/features/sessions/components/sessions-sidebar';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function EditSoclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell title="Modifier le socle" sidebar={<OverviewSidebar selected={null} />}>
      <EditSocleScreen id={Number(id)} />
    </AppShell>
  );
}

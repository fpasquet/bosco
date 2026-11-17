import { GroupScreen } from '@/features/projects/components/group-screen';
import { AppShell } from '@/shared/layouts/app-shell';

export default async function GroupInstructionsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  return (
    <AppShell title="Groupe" place={{ kind: 'group', id }}>
      <GroupScreen id={id} tab="instructions" />
    </AppShell>
  );
}

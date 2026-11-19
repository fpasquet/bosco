import { ProjectsScreen } from '@/features/projects/components/projects-screen';
import { AppShell } from '@/shared/layouts/app-shell';

const TITLE = 'Tous les projets';

/** « Tous les projets » ; ouverte depuis « Hors projet » (`?section=outside`), c'est cette ligne qui est active. */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { section } = await searchParams;
  return (
    <AppShell title={TITLE} place={{ kind: section === 'outside' ? 'outside' : 'projects' }}>
      <ProjectsScreen title={TITLE} />
    </AppShell>
  );
}

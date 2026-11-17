'use client';
import { ProjectsSidebar } from '@/features/projects/components/projects-sidebar';
import { ProfilesSidebar } from '@/features/sessions/components/sidebar-profiles';
import { useSidebarActivity } from '@/features/sessions/hooks/use-sidebar-activity';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Milieu de la barre latérale, sur toutes les pages : les groupes et les projets (avec leurs sessions ouvertes, lues
 * dans le flux en direct), puis les profils surveillés. Rien au premier lancement, tant qu'aucun profil n'est choisi.
 */
export function AppSidebar() {
  const { activity, watching } = useSidebarActivity();
  if (watching === false) return null;
  if (!activity)
    return (
      <div role="status" aria-busy className="flex flex-col gap-2.5 px-3 pt-5">
        <span className="sr-only">Chargement…</span>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  return (
    <>
      <ProjectsSidebar activity={activity} />
      <ProfilesSidebar />
    </>
  );
}

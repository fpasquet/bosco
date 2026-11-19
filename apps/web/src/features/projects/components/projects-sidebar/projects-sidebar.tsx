'use client';
import { useQuery } from '@tanstack/react-query';
import { useShellPlace } from '@/shared/layouts/app-shell';
import { Skeleton } from '@/shared/ui/skeleton';
import { groupsQuery } from '../../api/groups';
import { projectsOverviewQuery } from '../../api/projects';
import { GroupMenuButton } from '../group-menu';
import { useProjectActions } from '../project-actions';
import { ProjectMenuButton } from '../project-menu';
import { type SidebarActivity, SidebarPlaces } from '../sidebar-places';

export interface ProjectsSidebarProps {
  /** Sessions ouvertes par projet, du plus urgent au plus calme, et hors projet ; lues dans le flux en direct */
  activity: { outside: SidebarActivity; projects: (SidebarActivity & { id: number })[] };
}

const NONE: SidebarActivity = { count: 0, waiting: 0 };

/**
 * Groupes et projets de la barre latérale, reliés à Bosco : les groupes affichés, les projets épinglés ou qui ont une
 * session ouverte (plus celui dont la page est ouverte), chacun avec son menu ⋯.
 */
export function ProjectsSidebar({ activity }: ProjectsSidebarProps) {
  const place = useShellPlace();
  const actions = useProjectActions();
  const { data: overview } = useQuery(projectsOverviewQuery);
  const { data: groups } = useQuery(groupsQuery);
  if (!overview || !groups)
    return (
      <div role="status" aria-busy className="flex flex-col gap-2.5 px-3 pt-5">
        <span className="sr-only">Chargement…</span>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  const activityOf = new Map(activity.projects.map((entry) => [entry.id, entry]));
  const active = {
    group: place.kind === 'group' ? place.id : null,
    project: place.kind === 'project' ? place.id : null,
    outside: place.kind === 'outside',
    projects: place.kind === 'projects',
  };
  const known = new Map(overview.projects.map((project) => [project.id, project]));
  const open = activity.projects.flatMap(({ id }) => known.get(id) ?? []);
  const kept = overview.projects
    .filter((project) => !activityOf.has(project.id) && (project.pinned || project.id === active.project))
    .toSorted((a, b) => a.name.localeCompare(b.name, 'fr'));
  const shown = [...open, ...kept];
  const sidebarGroups = groups.filter((group) => group.sidebar && !group.system);
  return (
    <SidebarPlaces
      active={active}
      allProjects={overview.projects.length}
      outside={activity.outside}
      projects={shown.map(({ git, id, name }) => ({ git, id, name, ...(activityOf.get(id) ?? NONE) }))}
      groups={sidebarGroups.map(({ id, name, projects }) => ({
        id,
        name,
        count: projects.reduce((total, project) => total + (activityOf.get(project.id)?.count ?? 0), 0),
        waiting: projects.reduce((total, project) => total + (activityOf.get(project.id)?.waiting ?? 0), 0),
      }))}
      onBrowse={() => actions.browse()}
      onNewGroup={() => actions.newGroup()}
      projectMenu={(id) => {
        const project = known.get(id);
        return project && <ProjectMenuButton project={project} />;
      }}
      groupMenu={(id) => {
        const group = sidebarGroups.find((candidate) => candidate.id === id);
        return group && <GroupMenuButton group={group} />;
      }}
    />
  );
}

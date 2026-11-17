'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Layers, Monitor } from 'lucide-react';
import { useState } from 'react';
import type { ProjectDto } from '@bosco/domain';
import { displayPath } from '@/lib/format';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Button } from '@/shared/ui/button';
import { groupsQuery } from '../../api/groups';
import {
  addProjects,
  ignoreSuggestion,
  ProjectRefused,
  projectsOverviewQuery,
  proposalsQuery,
  restoreSuggestion,
  sessionsQuery,
} from '../../api/projects';
import { GroupsList } from '../groups-list';
import { NoProjects } from '../no-projects';
import { useProjectActions } from '../project-actions';
import { ProjectSheet } from '../project-sheet';
import { ProjectsList } from '../projects-list';

const REFRESH_MS = 60_000;

/**
 * « Tous les projets » : la liste des projets choisis et des groupes qui les réunissent, ou l'état vide qui propose les
 * dossiers des sessions. Créer un groupe, parcourir les dossiers et rejoindre un groupe passent par les mêmes fenêtres
 * que la barre latérale.
 */
export function ProjectsScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const actions = useProjectActions();
  const now = useNow(REFRESH_MS);
  const { data } = useQuery(projectsOverviewQuery);
  const { data: groups } = useQuery(groupsQuery);
  const { data: proposals } = useQuery(proposalsQuery);
  const { data: sessions } = useQuery(sessionsQuery);
  // Sur le téléphone, le projet touché ouvre la feuille de ses actions
  const [opened, setOpened] = useState<null | ProjectDto>(null);
  const change = useMutation({
    mutationFn: (work: () => Promise<unknown>) => work(),
    // Ranger une session change la vue d'ensemble, l'historique et le contexte : tout se relit
    onSuccess: () => client.invalidateQueries(),
    onError: (failure) =>
      push(
        failure instanceof ProjectRefused ? failure.message : 'Le changement n’a pas pu être enregistré.',
        'warning',
      ),
  });
  if (!data || !groups) return <PageSkeleton variant="list" rows={4} />;
  const empty = data.projects.length === 0;
  const count = data.projects.length;
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Breadcrumbs items={[{ label: 'Projets' }]} phoneBack={false} />
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {!empty && <p className="text-xs text-muted">{count > 1 ? `${count} projets` : `${count} projet`}</p>}
        </div>
        {!empty && (
          <div className="ml-auto hidden gap-2 md:flex">
            <Button variant="outline" onClick={() => actions.newGroup()}>
              <Layers aria-hidden className="size-4" />
              Nouveau groupe
            </Button>
            <Button variant="primary" onClick={actions.browse}>
              <FolderPlus aria-hidden className="size-4" />
              Ajouter des projets
            </Button>
          </div>
        )}
      </div>
      {!empty && (
        <p className="flex items-center gap-2 rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
          <Monitor aria-hidden className="size-4 shrink-0" />
          Ajouter des projets se fait depuis le poste.
        </p>
      )}
      {empty ? (
        <NoProjects
          busy={change.isPending}
          home={data.home}
          suggestions={data.suggestions}
          onBrowse={actions.browse}
          onAdd={(paths) => change.mutate(() => addProjects(paths))}
        />
      ) : (
        <>
          <ProjectsList
            busy={change.isPending}
            data={data}
            groups={groups}
            now={now}
            onAdd={(path) => change.mutate(() => addProjects([path]))}
            onAddToGroup={(project, group) => actions.addToGroup(project, group)}
            onIgnore={(path) => change.mutate(() => ignoreSuggestion(path))}
            onNewGroup={(project) => actions.newGroup([project.id])}
            onRestore={(path) => change.mutate(() => restoreSuggestion(path))}
            onOpen={setOpened}
            outsideSessions={(sessions ?? [])
              .filter((session) => session.project === null)
              .toSorted((a, b) => b.lastEventAt.localeCompare(a.lastEventAt))
              .map(({ id, lastEventAt, projectPath, title }) => ({
                id,
                lastEventAt,
                path: projectPath,
                title: title ?? `Session ${id.slice(0, 8)}`,
              }))}
          />
          <GroupsList groups={groups} />
        </>
      )}
      <ProjectSheet
        project={opened && { id: opened.id, name: opened.name, path: displayPath(opened.path, data.home) }}
        proposals={(proposals ?? []).filter((decision) => decision.target.name === opened?.name).length}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}

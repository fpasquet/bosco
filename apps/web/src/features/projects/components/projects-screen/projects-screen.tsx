'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GroupDto, ProjectDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { arrangeProjects, createGroup, GroupRefused, groupsQuery } from '../../api/groups';
import {
  addProjects,
  ignoreSuggestion,
  ProjectRefused,
  projectsOverviewQuery,
  restoreSuggestion,
} from '../../api/projects';
import { instructionLines } from '../../lib/groups';
import { FolderBrowserDialog } from '../folder-browser';
import { GroupConfirmDialog, TouchedProjects } from '../group-confirm-dialog';
import { GroupsList } from '../groups-list';
import { NewGroupDialog } from '../new-group-dialog';
import { NoProjects } from '../no-projects';
import { ProjectsList } from '../projects-list';

const REFRESH_MS = 60_000;

/** Projet à ajouter à un groupe qui a des instructions, en attente de confirmation. */
interface Joining {
  group: GroupDto;
  project: ProjectDto;
}

/**
 * « Tous les projets » : la liste des projets choisis et des groupes qui les réunissent, ou l'état vide qui propose les
 * dossiers des sessions.
 */
export function ProjectsScreen({ title }: { title: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const now = useNow(REFRESH_MS);
  const { data } = useQuery(projectsOverviewQuery);
  const { data: groups } = useQuery(groupsQuery);
  const [browsing, setBrowsing] = useState(false);
  // null : fenêtre fermée ; sinon les projets cochés à son ouverture
  const [newGroup, setNewGroup] = useState<null | number[]>(null);
  const [groupError, setGroupError] = useState<null | string>(null);
  const [joining, setJoining] = useState<Joining | null>(null);
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
  const create = useMutation({
    mutationFn: createGroup,
    onSuccess: async (group) => {
      setNewGroup(null);
      await client.invalidateQueries({ queryKey: ['groups'] });
      router.push(`/groups/${group.id}/settings`);
    },
    onError: (failure) =>
      setGroupError(failure instanceof GroupRefused ? failure.message : 'Le groupe n’a pas pu être créé.'),
  });
  const join = (group: GroupDto, project: ProjectDto) =>
    change.mutate(async () => {
      setJoining(null);
      await arrangeProjects(group.id, [...group.projects.map(({ id }) => id), project.id]);
    });
  if (!data || !groups) return <PageSkeleton variant="list" rows={4} />;
  const empty = data.projects.length === 0;
  const count = data.projects.length;
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs text-muted">Projets</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {!empty && <p className="text-xs text-muted">{count > 1 ? `${count} projets` : `${count} projet`}</p>}
        </div>
        {!empty && (
          <div className="ml-auto hidden gap-2 md:flex">
            <Button
              variant="outline"
              onClick={() => {
                setGroupError(null);
                setNewGroup([]);
              }}
            >
              <Layers aria-hidden className="size-4" />
              Nouveau groupe
            </Button>
            <Button variant="primary" onClick={() => setBrowsing(true)}>
              <FolderPlus aria-hidden className="size-4" />
              Ajouter des projets
            </Button>
          </div>
        )}
      </div>
      {!empty && (
        <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
          Modifiable depuis le poste. L’ajout de projets et les groupes sont réservés à toi.
        </p>
      )}
      {empty ? (
        <NoProjects
          busy={change.isPending}
          home={data.home}
          suggestions={data.suggestions}
          onBrowse={() => setBrowsing(true)}
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
            onAddToGroup={(project, group) =>
              // Un groupe qui a des instructions les transmet au projet ajouté : confirmation
              instructionLines(group.instructions).length > 0 ? setJoining({ group, project }) : join(group, project)
            }
            onIgnore={(path) => change.mutate(() => ignoreSuggestion(path))}
            onNewGroup={(project) => {
              setGroupError(null);
              setNewGroup([project.id]);
            }}
            onRestore={(path) => change.mutate(() => restoreSuggestion(path))}
          />
          <GroupsList groups={groups} />
        </>
      )}
      <NewGroupDialog
        open={newGroup !== null}
        initialProjects={newGroup ?? []}
        busy={create.isPending}
        projects={data.projects.map(({ id, name }) => ({ id, name }))}
        serverError={groupError}
        onCancel={() => setNewGroup(null)}
        onSubmit={(group) => {
          setGroupError(null);
          create.mutate(group);
        }}
      />
      {joining && (
        <GroupConfirmDialog
          open
          busy={change.isPending}
          title={`Ajouter ${joining.project.name} à ${joining.group.name} ?`}
          confirmLabel="Ajouter"
          onCancel={() => setJoining(null)}
          onConfirm={() => join(joining.group, joining.project)}
        >
          <TouchedProjects
            intro="Les instructions du groupe arriveront aux prochains agents de"
            projects={[joining.project.name]}
          />
        </GroupConfirmDialog>
      )}
      <FolderBrowserDialog open={browsing} onClose={() => setBrowsing(false)} />
    </div>
  );
}

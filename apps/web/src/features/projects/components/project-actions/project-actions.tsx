'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { useNotices } from '@/shared/hooks/use-notices';
import { APP_NAME, type GroupDto } from '@bosco/domain';
import { arrangeProjects, changeGroup, createGroup, deleteGroup, GroupRefused, groupsQuery } from '../../api/groups';
import {
  changeProject,
  projectContextQuery,
  projectQuery,
  ProjectRefused,
  projectsOverviewQuery,
  removeProject,
} from '../../api/projects';
import { instructionLines } from '../../lib/groups';
import { FolderBrowserDialog } from '../folder-browser';
import { GroupConfirmDialog, TouchedProjects } from '../group-confirm-dialog';
import { NewGroupDialog } from '../new-group-dialog';
import { RemoveProjectDialog } from '../remove-project-dialog';

type Named = { id: number; name: string };

/** Actions des menus ⋯ et des ＋ de la barre latérale, offertes à toute page : les fenêtres s'ouvrent par-dessus. */
export interface ProjectActions {
  addToGroup: (project: Named, group: GroupDto) => void;
  browse: () => void;
  deleteGroup: (group: GroupDto) => void;
  newGroup: (projects?: number[]) => void;
  pin: (project: Named, pinned: boolean) => void;
  remove: (project: Named) => void;
  showGroup: (group: GroupDto, shown: boolean) => void;
}

const NO_ACTIONS: ProjectActions = {
  addToGroup: () => undefined,
  browse: () => undefined,
  deleteGroup: () => undefined,
  newGroup: () => undefined,
  pin: () => undefined,
  remove: () => undefined,
  showGroup: () => undefined,
};

const Actions = createContext<ProjectActions>(NO_ACTIONS);

export function useProjectActions(): ProjectActions {
  return useContext(Actions);
}

/** Fenêtre ouverte par une action, en attente de la personne. */
type Open =
  | { group: GroupDto; kind: 'delete-group' }
  | { group: GroupDto; kind: 'join'; project: Named }
  | { kind: 'browse' }
  | { kind: 'new-group'; projects: number[] }
  | { kind: 'remove'; project: Named };

/** Projet suivant d'un groupe qui perd son projet principal. */
function nextPrincipal(group: GroupDto, project: number): null | string {
  if (group.projects[0]?.id !== project) return null;
  return group.projects[1]?.name ?? null;
}

function RemoveProject({
  busy,
  groups,
  onCancel,
  onConfirm,
  project,
}: {
  busy: boolean;
  groups: GroupDto[];
  onCancel: () => void;
  onConfirm: () => void;
  project: Named;
}) {
  const { data: detail } = useQuery(projectQuery(project.id));
  const { data: context } = useQuery(projectContextQuery(project.name));
  const joined = groups.filter((group) => !group.system && group.projects.some(({ id }) => id === project.id));
  return (
    <RemoveProjectDialog
      open
      busy={busy || !detail}
      name={project.name}
      sessions={detail?.sessions ?? 0}
      running={detail?.running ?? 0}
      decisions={(context?.decisions.length ?? 0) + (context?.proposed.length ?? 0)}
      groups={joined.map((group) => ({ name: group.name, next: nextPrincipal(group, project.id) }))}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

/**
 * Actions sur les projets et les groupes, partagées par la barre latérale, l'en-tête d'une page de projet ou de groupe
 * et la liste des projets : épingler, rejoindre un groupe, créer un groupe, parcourir les dossiers, retirer.
 */
export function ProjectActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const [open, setOpen] = useState<null | Open>(null);
  const [groupError, setGroupError] = useState<null | string>(null);
  const { data: groups } = useQuery({ ...groupsQuery, enabled: open !== null });
  const { data: overview } = useQuery({ ...projectsOverviewQuery, enabled: open?.kind === 'new-group' });
  const close = () => setOpen(null);
  const refused = (failure: Error) =>
    push(
      failure instanceof ProjectRefused || failure instanceof GroupRefused
        ? failure.message
        : 'Le changement n’a pas pu être enregistré.',
      'warning',
    );
  const change = useMutation({
    mutationFn: (work: () => Promise<unknown>) => work(),
    // Une épingle, un groupe ou un retrait changent la barre latérale, les pages et le contexte : tout se relit
    onSuccess: async () => {
      close();
      await client.invalidateQueries();
    },
    onError: (failure) => {
      close();
      refused(failure);
    },
  });
  const create = useMutation({
    mutationFn: createGroup,
    onSuccess: async (group) => {
      close();
      await client.invalidateQueries({ queryKey: ['groups'] });
      router.push(`/groups/${group.id}/settings`);
    },
    onError: (failure) =>
      setGroupError(failure instanceof GroupRefused ? failure.message : 'Le groupe n’a pas pu être créé.'),
  });
  const join = (group: GroupDto, project: Named) =>
    change.mutate(() => arrangeProjects(group.id, [...group.projects.map(({ id }) => id), project.id]));
  const actions: ProjectActions = {
    // Un groupe qui a des instructions les transmet au projet ajouté : confirmation
    addToGroup: (project, group) =>
      instructionLines(group.instructions).length > 0
        ? setOpen({ kind: 'join', group, project })
        : join(group, project),
    browse: () => setOpen({ kind: 'browse' }),
    deleteGroup: (group) => setOpen({ kind: 'delete-group', group }),
    newGroup: (projects = []) => {
      setGroupError(null);
      setOpen({ kind: 'new-group', projects });
    },
    pin: (project, pinned) => change.mutate(() => changeProject(project.id, { pinned })),
    remove: (project) => setOpen({ kind: 'remove', project }),
    showGroup: (group, shown) => change.mutate(() => changeGroup(group.id, { sidebar: shown })),
  };
  const confirmRemove = (project: Named) =>
    change.mutate(async () => {
      await removeProject(project.id);
      push(`${project.name} retiré de ${APP_NAME}`, 'success');
      // Le projet retiré revient en suggestion dans la liste des projets
      router.push('/projects');
    });
  const confirmDelete = (group: GroupDto) =>
    change.mutate(async () => {
      await deleteGroup(group.id);
      push('Groupe supprimé', 'success');
      if (pathname.startsWith(`/groups/${group.id}/`)) router.push('/projects');
    });
  return (
    <Actions.Provider value={actions}>
      {children}
      {open?.kind === 'remove' && (
        <RemoveProject
          busy={change.isPending}
          groups={groups ?? []}
          project={open.project}
          onCancel={close}
          onConfirm={() => confirmRemove(open.project)}
        />
      )}
      {open?.kind === 'join' && (
        <GroupConfirmDialog
          open
          busy={change.isPending}
          title={`Ajouter ${open.project.name} à ${open.group.name} ?`}
          confirmLabel="Ajouter"
          onCancel={close}
          onConfirm={() => join(open.group, open.project)}
        >
          <TouchedProjects
            intro="Les instructions du groupe arriveront aux prochains agents de"
            projects={[open.project.name]}
          />
        </GroupConfirmDialog>
      )}
      {open?.kind === 'delete-group' && (
        <GroupConfirmDialog
          open
          busy={change.isPending}
          destructive
          title={`Supprimer le groupe ${open.group.name} ?`}
          confirmLabel="Supprimer le groupe"
          onCancel={close}
          onConfirm={() => confirmDelete(open.group)}
        >
          <p>Aucun projet n’est retiré : ils restent dans {APP_NAME}, avec leurs sessions et leurs décisions.</p>
        </GroupConfirmDialog>
      )}
      {open?.kind === 'new-group' && overview && (
        <NewGroupDialog
          open
          initialProjects={open.projects}
          busy={create.isPending}
          projects={overview.projects.map(({ id, name }) => ({ id, name }))}
          serverError={groupError}
          onCancel={close}
          onSubmit={(group) => {
            setGroupError(null);
            create.mutate(group);
          }}
        />
      )}
      {open?.kind === 'browse' && <FolderBrowserDialog open onClose={close} />}
    </Actions.Provider>
  );
}

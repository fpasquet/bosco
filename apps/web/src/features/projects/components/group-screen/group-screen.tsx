'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { ContextPreviewDialog } from '@/shared/components/context-preview-dialog';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { APP_NAME, type GroupDto } from '@bosco/domain';
import {
  arrangeProjects,
  changeGroup,
  deleteGroup,
  GroupRefused,
  groupsQuery,
  inheritedDefaultsQuery,
  previewQuery,
  profilesQuery,
  writeInstructions,
} from '../../api/groups';
import { projectsOverviewQuery } from '../../api/projects';
import { instructionLines, previewChoices, touchedProjects } from '../../lib/groups';
import { GroupConfirmDialog, TouchedProjects } from '../group-confirm-dialog';
import { GroupHeader, type GroupTab } from '../group-header';
import { GroupInstructions } from '../group-instructions';
import { GroupMenuButton } from '../group-menu';
import { GroupSettings } from '../group-settings';
import { useProjectActions } from '../project-actions';

type Member = GroupDto['projects'][number];

/** Changement qui attend sa confirmation : il touche les prochains agents des projets comptés, ou supprime le groupe. */
type Pending =
  | { kind: 'delete' }
  | { kind: 'instructions'; text: string }
  | { kind: 'projects'; projects: Member[]; touched: string[] };

function confirmationOf(pending: Pending, group: GroupDto) {
  if (pending.kind === 'delete')
    return {
      title: `Supprimer le groupe ${group.name} ?`,
      confirmLabel: 'Supprimer le groupe',
      destructive: true,
      body: <p>Aucun projet n’est retiré : ils restent dans {APP_NAME}, avec leurs sessions et leurs décisions.</p>,
    };
  if (pending.kind === 'instructions')
    return {
      title: 'Enregistrer les instructions ?',
      confirmLabel: 'Enregistrer',
      destructive: false,
      body: (
        <TouchedProjects
          intro="Elles seront transmises aux prochains agents de"
          projects={group.projects.map(({ name }) => name)}
        />
      ),
    };
  return {
    title: `Changer les projets de ${group.name} ?`,
    confirmLabel: 'Enregistrer',
    destructive: false,
    body: (
      <TouchedProjects
        intro="Les instructions du groupe changent pour les prochains agents de"
        projects={pending.touched}
      />
    ),
  };
}

/**
 * Page d'un groupe : ses sessions (le contenu de l'onglet, children), ses instructions et ses réglages, chacun
 * dans son onglet ; le téléphone lit.
 */
export function GroupScreen({ children, id, tab }: { children?: ReactNode; id: number; tab: GroupTab }) {
  const router = useRouter();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const actions = useProjectActions();
  const { data: groups } = useQuery(groupsQuery);
  const { data: overview } = useQuery(projectsOverviewQuery);
  const { data: sources } = useQuery({ ...profilesQuery, enabled: tab === 'settings' });
  const { data: inherited } = useQuery({ ...inheritedDefaultsQuery({ group: id }), enabled: tab === 'settings' });
  const [pending, setPending] = useState<null | Pending>(null);
  const [nameError, setNameError] = useState<null | string>(null);
  const [previewing, setPreviewing] = useState(false);
  const group = groups?.find((candidate) => candidate.id === id);
  // « Tous les projets » n'a que ses instructions : ses autres adresses y mènent
  const elsewhere = group?.system === true && tab !== 'instructions';
  useEffect(() => {
    if (elsewhere) router.replace(`/groups/${id}/instructions`);
  }, [elsewhere, id, router]);
  const [previewed, setPreviewed] = useState<null | string>(null);
  const choices = group ? previewChoices(group) : [];
  // Le projet principal par défaut ; « Tous les projets », sans principal, le premier par ordre alphabétique
  const principal = previewed !== null && choices.includes(previewed) ? previewed : (choices[0] ?? '');
  const { data: preview } = useQuery({ ...previewQuery(principal), enabled: previewing && principal !== '' });
  const change = useMutation({
    mutationFn: (work: () => Promise<unknown>) => work(),
    // Instructions et projets changent le texte transmis : contexte et aperçus se relisent
    onSuccess: async () => {
      setPending(null);
      await client.invalidateQueries();
    },
    onError: (failure) => {
      setPending(null);
      // Un nom déjà pris s'affiche sous son champ
      if (failure instanceof GroupRefused && failure.code === 'groupNameTaken') return;
      push(failure instanceof GroupRefused ? failure.message : 'Le changement n’a pas pu être enregistré.', 'warning');
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: async () => {
      setPending(null);
      push('Groupe supprimé', 'success');
      await client.invalidateQueries({ queryKey: ['groups'] });
      router.push('/projects');
    },
    onError: () => {
      setPending(null);
      push('Le groupe n’a pas pu être supprimé.', 'warning');
    },
  });
  if (!groups) return <PageSkeleton variant="form" rows={4} />;
  if (!group)
    return (
      <div className="flex flex-col gap-2 p-4 md:px-8 md:pt-6">
        <p>Ce groupe n’existe pas ou a été supprimé.</p>
        <Link href="/projects" className="link">
          Revenir aux projets
        </Link>
      </div>
    );
  const arrange = (projects: Member[]) => {
    const touched = touchedProjects(group.projects, projects);
    // Un groupe sans instructions ne change rien pour les agents : pas de confirmation
    if (instructionLines(group.instructions).length > 0 && touched.length > 0)
      setPending({ kind: 'projects', projects, touched });
    else
      change.mutate(() =>
        arrangeProjects(
          id,
          projects.map(({ id: project }) => project),
        ),
      );
  };
  const confirm = (current: Pending) => {
    if (current.kind === 'delete') remove.mutate();
    else if (current.kind === 'instructions') change.mutate(() => writeInstructions(id, current.text));
    else
      change.mutate(() =>
        arrangeProjects(
          id,
          current.projects.map(({ id: project }) => project),
        ),
      );
  };
  const confirmation = pending ? confirmationOf(pending, group) : null;
  const busy = change.isPending || remove.isPending;
  // « Tous les projets » n'a que ses instructions
  const shown: GroupTab = group.system ? 'instructions' : tab;
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <GroupHeader
        group={group}
        tab={shown}
        menu={!group.system && <GroupMenuButton group={group} variant="header" />}
      />
      {shown === 'sessions' && children}
      {shown === 'settings' && (
        <GroupSettings
          busy={busy}
          group={group}
          inherited={inherited}
          profiles={(sources?.sources ?? [])
            .filter(({ watched }) => watched)
            .map(({ label, path }) => ({ label, path }))}
          projects={(overview?.projects ?? []).map(({ id: project, name }) => ({ id: project, name }))}
          serverError={nameError}
          onArrange={arrange}
          onBrowse={actions.browse}
          onDelete={() => setPending({ kind: 'delete' })}
          onDefaults={(defaults) => change.mutate(() => changeGroup(id, { defaults }))}
          onSidebar={(sidebar) => change.mutate(() => changeGroup(id, { sidebar }))}
          onRename={(identity) => {
            setNameError(null);
            change.mutate(() =>
              changeGroup(id, identity).catch((failure: unknown) => {
                if (failure instanceof GroupRefused) setNameError(failure.message);
                throw failure;
              }),
            );
          }}
        />
      )}
      {shown === 'instructions' && (
        <GroupInstructions
          // Les instructions enregistrées repartent d'un formulaire propre
          key={group.instructions}
          busy={busy}
          group={group}
          groups={groups}
          onSave={(text) => setPending({ kind: 'instructions', text })}
          onPreview={() => {
            void client.invalidateQueries({ queryKey: ['context-preview'] });
            setPreviewing(true);
          }}
        />
      )}
      {confirmation && (
        <GroupConfirmDialog
          open
          busy={busy}
          title={confirmation.title}
          confirmLabel={confirmation.confirmLabel}
          destructive={confirmation.destructive}
          onCancel={() => setPending(null)}
          onConfirm={() => pending && confirm(pending)}
        >
          {confirmation.body}
        </GroupConfirmDialog>
      )}
      {principal && (
        <ContextPreviewDialog
          open={previewing}
          project={principal}
          choices={choices}
          onProjectChange={setPreviewed}
          preview={preview}
          onClose={() => setPreviewing(false)}
          onCopy={(text) => void navigator.clipboard?.writeText(text).catch(() => undefined)}
        />
      )}
    </div>
  );
}

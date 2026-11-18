'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import {
  addProjects,
  ignoreSuggestion,
  ProjectRefused,
  projectsOverviewQuery,
  restoreSuggestion,
} from '../../api/projects';
import { FolderBrowserDialog } from '../folder-browser';
import { NoProjects } from '../no-projects';
import { ProjectsList } from '../projects-list';

const REFRESH_MS = 60_000;

/** « Tous les projets » : la liste des projets choisis, ou l'état vide qui propose les dossiers des sessions. */
export function ProjectsScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const now = useNow(REFRESH_MS);
  const { data } = useQuery(projectsOverviewQuery);
  const [browsing, setBrowsing] = useState(false);
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
  if (!data) return <PageSkeleton variant="list" rows={4} />;
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
          <Button variant="primary" className="ml-auto hidden md:inline-flex" onClick={() => setBrowsing(true)}>
            <FolderPlus aria-hidden className="size-4" />
            Ajouter des projets
          </Button>
        )}
      </div>
      {!empty && (
        <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
          Modifiable depuis le poste. L’ajout de projets est réservé à toi.
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
        <ProjectsList
          busy={change.isPending}
          data={data}
          now={now}
          onAdd={(path) => change.mutate(() => addProjects([path]))}
          onIgnore={(path) => change.mutate(() => ignoreSuggestion(path))}
          onRestore={(path) => change.mutate(() => restoreSuggestion(path))}
        />
      )}
      <FolderBrowserDialog open={browsing} onClose={() => setBrowsing(false)} />
    </div>
  );
}

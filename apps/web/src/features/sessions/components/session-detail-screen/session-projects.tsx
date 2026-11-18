'use client';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RetrievedBranchesDto, SessionDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import { projectDetailQuery, retrieveBranches, sandboxBranchesQuery } from '../../api/pilot';
import { filesIn } from '../../lib/detail';
import { type CardProject, ProjectsCard } from '../projects-card';

/** Ce que dit la récupération : la branche reçue dans chaque projet, ou qu'aucune n'avait de travail. */
function retrievedMessage(retrieved: RetrievedBranchesDto, names: Map<string, string>): string {
  if (retrieved.branches.length === 0) return 'Aucune branche n’a de travail à récupérer.';
  return `Récupérée dans ${retrieved.branches
    .map(({ branch, project }) => `${names.get(project) ?? project} (${branch})`)
    .join(', ')}`;
}

/**
 * Projets d'une session à plusieurs projets (E2k, CA-SESS-138, CA-SESS-141) : sur le poste, la branche courante et les
 * fichiers modifiés de chacun ; en bac à sable, la branche de chaque copie, ce qu'elle a changé et sa récupération.
 */
export function SessionProjects({ busy, session }: { busy: boolean; session: SessionDto }) {
  const client = useQueryClient();
  const notify = useNotices((state) => state.push);
  const sandbox = session.pilot?.sandbox ?? null;
  const principal = {
    id: session.project?.id ?? null,
    name: session.project?.name ?? '',
    root: session.project?.root ?? '',
  };
  const all = [principal, ...session.addedProjects];
  const names = new Map(all.map(({ name, root }) => [root, name]));
  const details = useQueries({
    queries: session.addedProjects.map(({ id }) => ({
      ...projectDetailQuery(id ?? 0),
      enabled: !sandbox && id !== null,
    })),
  });
  const { data: branches } = useQuery({ ...sandboxBranchesQuery(session.id), enabled: Boolean(sandbox) });
  const retrieve = useMutation({
    mutationFn: (root: null | string) => retrieveBranches(session.id, root),
    onSuccess: async (retrieved) => {
      notify(retrievedMessage(retrieved, names), retrieved.branches.length > 0 ? 'success' : 'info');
      await client.invalidateQueries({ queryKey: sandboxBranchesQuery(session.id).queryKey });
    },
    onError: (error) => notify(error instanceof Error ? error.message : 'Le bac à sable n’a pas répondu.', 'warning'),
  });
  const projects: CardProject[] = sandbox
    ? all.map(({ name, root }) => {
        const found = branches?.branches.find(({ project }) => project === root);
        return {
          branch: sandbox.branch,
          files: found?.files ?? null,
          from: found?.from,
          name,
          retrievedAt: found?.retrievedAt ?? null,
          root,
        };
      })
    : all.map(({ name, root }, index) => ({
        branch: index === 0 ? session.branch : (details[index - 1]?.data?.branch ?? null),
        files: filesIn(session, root).length,
        name,
        root,
      }));
  return (
    <ProjectsCard
      projects={projects}
      busy={busy || retrieve.isPending}
      onRetrieve={sandbox && !sandbox.removed ? (root) => retrieve.mutate(root) : undefined}
    />
  );
}

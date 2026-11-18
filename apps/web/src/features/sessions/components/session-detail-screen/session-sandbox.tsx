'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PilotSandboxDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import { removeSandbox, retrieveBranches, sandboxUsageQuery, stopSandbox } from '../../api/pilot';
import { SandboxCard } from '../sandbox-card';

export interface SessionSandboxProps {
  /** Un tour est en cours : la copie s'écrit encore */
  running: boolean;
  sandbox: PilotSandboxDto;
  sessionId: string;
  /** Session à plusieurs projets : la carte « Branches » récupère les branches, pas celle-ci */
  several: boolean;
}

/**
 * Bac à sable d'une session : sa carte, avec la consommation du conteneur démarré, la récupération de la branche,
 * l'arrêt et la suppression.
 */
export function SessionSandbox({ running, sandbox, sessionId, several }: SessionSandboxProps) {
  const notify = useNotices((state) => state.push);
  const { data: usage } = useQuery({ ...sandboxUsageQuery(sessionId), enabled: sandbox.state === 'running' });
  const failed = (error: unknown) =>
    notify(error instanceof Error ? error.message : 'Le bac à sable n’a pas répondu.', 'warning');
  const retrieve = useMutation({
    mutationFn: async () => {
      const { branch } = await retrieveBranches(sessionId);
      return branch ?? '';
    },
    onSuccess: (branch) => {
      notify(
        branch === sandbox.branch
          ? `Branche récupérée : ${branch}`
          : `Branche modifiée sur le poste : récupérée sous ${branch}`,
        'success',
      );
    },
    onError: failed,
  });
  const stop = useMutation({ mutationFn: () => stopSandbox(sessionId), onError: failed });
  const remove = useMutation({ mutationFn: () => removeSandbox(sessionId), onError: failed });
  return (
    <SandboxCard
      sandbox={sandbox}
      usage={usage}
      busy={running || retrieve.isPending || stop.isPending || remove.isPending}
      onRetrieve={several ? undefined : () => retrieve.mutate()}
      onStop={() => stop.mutate()}
      onRemove={() => remove.mutate()}
    />
  );
}

'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkContainers, containersQuery, interruptTurn } from '../api/containers';

/** Actions du panneau des conteneurs : « Réessayer » quand Docker ne répond pas, « Arrêter le tour » d'une session. */
export function useContainerActions() {
  const client = useQueryClient();
  const check = useMutation({
    mutationFn: checkContainers,
    onSuccess: (view) => client.setQueryData(containersQuery.queryKey, view),
  });
  const interrupt = useMutation({ mutationFn: interruptTurn });
  return {
    interrupt: (sessionId: string) => interrupt.mutate(sessionId),
    retry: () => check.mutate(),
    retrying: check.isPending,
  };
}

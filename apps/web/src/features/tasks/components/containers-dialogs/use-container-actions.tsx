'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import type { ContainersDto, RunningAgentDto, RunningServiceDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import { checkContainers, containersQuery, interruptTurn, removeLeftovers, restartService } from '../../api/containers';
import { cancelTask } from '../../api/tasks';
import { LogsDialog, RestartDialog, StopAgentDialog } from './containers-dialogs';

type Dialog =
  | { agent: RunningAgentDto; kind: 'restart'; service: RunningServiceDto }
  | { agent: RunningAgentDto; kind: 'stop' }
  | { kind: 'logs'; service: RunningServiceDto };

/** Actions du panneau des conteneurs (E19a à E19d), communes au poste et au téléphone, avec leurs confirmations. */
export function useContainerActions() {
  const client = useQueryClient();
  const notify = useNotices((state) => state.push);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const update = (view: ContainersDto) => client.setQueryData(containersQuery.queryKey, view);
  const retry = useMutation({ mutationFn: checkContainers, onSuccess: update });
  const remove = useMutation({ mutationFn: (name?: string) => removeLeftovers(name), onSuccess: update });
  const restart = useMutation({
    mutationFn: (service: RunningServiceDto) => restartService(service.name),
    onSuccess: update,
    onError: () => notify('Le service n’a pas pu redémarrer.', 'warning'),
  });
  const stop = useMutation({
    mutationFn: (agent: RunningAgentDto) => cancelTask(agent.taskId),
    onSuccess: (_task, agent) => {
      setDialog(null);
      notify(`T-${agent.taskId} annulée : l’agent s’arrête`, 'info');
    },
  });
  const interrupt = useMutation({
    mutationFn: interruptTurn,
    onError: () => notify('Le tour n’a pas pu être arrêté.', 'warning'),
  });
  const close = () => setDialog(null);
  let dialogs: ReactNode = null;
  if (dialog?.kind === 'restart')
    dialogs = (
      <RestartDialog
        agent={dialog.agent}
        service={dialog.service}
        onClose={close}
        onRestart={() => {
          restart.mutate(dialog.service);
          close();
        }}
      />
    );
  if (dialog?.kind === 'stop')
    dialogs = (
      <StopAgentDialog
        agent={dialog.agent}
        busy={stop.isPending}
        onClose={close}
        onStop={() => stop.mutate(dialog.agent)}
      />
    );
  if (dialog?.kind === 'logs') dialogs = <LogsDialog service={dialog.service} onClose={close} />;
  return {
    askLogs: (service: RunningServiceDto) => setDialog({ kind: 'logs', service }),
    askRestart: (agent: RunningAgentDto, service: RunningServiceDto) => setDialog({ agent, kind: 'restart', service }),
    askStop: (agent: RunningAgentDto) => setDialog({ agent, kind: 'stop' }),
    dialogs,
    interrupt: (sessionId: string) => interrupt.mutate(sessionId),
    remove: (name?: string) => remove.mutate(name),
    removing: remove.isPending,
    retry: () => retry.mutate(),
    retrying: retry.isPending,
  };
}

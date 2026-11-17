'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { usd } from '../../lib/tasks';
import { TaskLog } from '../task-log';
import { TaskStateBadge } from '../task-state-badge';

export interface TaskDetailProps {
  busy: boolean;
  /** Tâches qui échoueraient avec l'annulation : la confirmation les nomme (E13c) */
  failing: TaskDto[];
  onCancel: () => void;
  onRelaunch: (changes: { fromBranch: boolean; instruction?: string }) => void;
  /** Fil de la tâche et ses modifications, comme pour une session (RF-TACH-10) */
  panel: ReactNode;
  /** Ressources d'une tâche du worker en cours, sous l'en-tête (E13d) */
  resources?: ReactNode;
  task: TaskDto;
}

function CancelConfirmation({
  failing,
  onCancel,
  onClose,
}: {
  failing: TaskDto[];
  onCancel: () => void;
  onClose: () => void;
}) {
  return (
    <section
      role="alertdialog"
      aria-labelledby="cancel-title"
      className="rounded-card border border-danger bg-danger-soft p-4"
    >
      <h3 id="cancel-title" className="font-semibold text-danger">
        Annuler cette tâche fera échouer {failing.length > 1 ? `${failing.length} tâches` : '1 tâche'}
      </h3>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {failing.map((task) => (
          <li key={task.id}>
            T-{task.id} · {task.title}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Garder la tâche
        </Button>
        <Button variant="destructive" size="sm" onClick={onCancel}>
          Annuler la tâche
        </Button>
      </div>
    </section>
  );
}

const relaunchSchema = z.object({
  start: z.enum(['branch', 'scratch']),
  instruction: z.string().max(5000),
});

type RelaunchValues = z.infer<typeof relaunchSchema>;

function Relaunch({ busy, onRelaunch }: Pick<TaskDetailProps, 'busy' | 'onRelaunch'>) {
  const { handleSubmit, register } = useForm<RelaunchValues>({
    resolver: zodResolver(relaunchSchema),
    defaultValues: {
      start: 'branch',
      instruction: '',
    },
  });
  const relaunch = handleSubmit(({ instruction, start }) =>
    onRelaunch({ fromBranch: start === 'branch', instruction: instruction.trim() || undefined }),
  );
  return (
    <form
      noValidate
      onSubmit={(event) => void relaunch(event)}
      aria-labelledby="relaunch-title"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 id="relaunch-title" className="font-semibold">
        Relancer
      </h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Point de départ</legend>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" value="branch" {...register('start')} />
          Repartir de la branche (garde le travail déjà fait)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" value="scratch" {...register('start')} />
          Repartir de zéro
        </label>
      </fieldset>
      <p className="text-xs text-muted">
        Elle repart quand le quota de son abonnement repasse sous le seuil d’attente.
      </p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Consigne en plus (facultatif)</span>
        <textarea className="textarea w-full" rows={2} {...register('instruction')} />
      </label>
      <Button type="submit" className="self-start" disabled={busy}>
        Relancer
      </Button>
    </form>
  );
}

/**
 * Détail d'une tâche (E13a à E13d), à la disposition d'une session (RF-TACH-10) : le fil de l'agent au centre, et à
 * droite ce qu'elle attend, ses garde-fous, ses ressources, sa relance et son journal.
 */
export function TaskDetail({ busy, failing, onCancel, onRelaunch, panel, resources, task }: TaskDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const canCancel = !['cancelled', 'failed', 'rejected', 'validated'].includes(task.state);
  // Une tâche du worker en cours s'annule depuis la barre du fil (« L'agent travaille seul »)
  const cancelInHeader = canCancel && !(task.state === 'running' && task.mode === 'worker');
  const failed = task.state === 'failed' || task.state === 'rejected';
  return (
    <div className="flex min-h-full flex-col gap-4">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <nav aria-label="Fil d’Ariane" className="flex items-center gap-1 text-xs text-muted">
            <Link href="/tasks" className="link link-hover">
              Tâches
            </Link>
            <ChevronRight aria-hidden className="size-3" />
            T-{task.id}
          </nav>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold md:text-2xl">
            <TaskStateBadge state={task.state} />
            {task.title}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {task.repository.name}
            {task.folder ? ` · ${task.folder}` : ''} · {task.mode === 'worker' ? 'Worker' : 'Ma session'}
            {task.outcome.branch ? ` · ${task.outcome.branch}` : ''}
            {task.createdBy === 'session' ? ' · créée par une session' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {task.editable && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tasks/${task.id}/edit`}>Modifier</Link>
            </Button>
          )}
          {cancelInHeader && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => (failing.length > 0 ? setConfirming(true) : onCancel())}
            >
              Annuler la tâche
            </Button>
          )}
        </div>
      </header>
      {confirming && canCancel && (
        <CancelConfirmation
          failing={failing}
          onClose={() => setConfirming(false)}
          onCancel={() => {
            setConfirming(false);
            onCancel();
          }}
        />
      )}
      {task.state === 'awaiting_session' && (
        <p className="rounded-card border border-line bg-surface-alt px-4 py-3">
          À prendre depuis Claude Code sur le poste : dans le dépôt, demande « prends la prochaine tâche Bosco ». Le
          serveur MCP de Bosco s’ajoute à un profil avec <code className="font-mono">bosco mcp install</code>.
        </p>
      )}
      {task.outcome.pullRequest && (
        <p className="rounded-card border border-line bg-surface px-4 py-3">
          PR en brouillon :{' '}
          <a href={task.outcome.pullRequest} className="link link-primary" target="_blank" rel="noreferrer">
            {task.outcome.pullRequest}
          </a>
        </p>
      )}
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-3">
        <div className="flex min-h-0 min-w-0 flex-col md:col-span-2">{panel}</div>
        <aside className="flex flex-col gap-4">
          {resources}
          {failed && <Relaunch busy={busy} onRelaunch={onRelaunch} />}
          <section aria-labelledby="waits-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 id="waits-title" className="mb-2 text-xs font-semibold text-muted">
              Elle attend
            </h2>
            {task.waitingFor.length === 0 ? (
              <p className="text-sm text-muted">Aucune tâche préalable.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {task.waitingFor.map((prerequisite) => (
                  <li key={prerequisite.id} className="flex items-center gap-2">
                    <Link href={`/tasks/${prerequisite.id}`} className="min-w-0 flex-1 link truncate link-hover">
                      T-{prerequisite.id} · {prerequisite.title}
                    </Link>
                    <TaskStateBadge state={prerequisite.state} />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              {task.startFrom
                ? `Partira de la branche de T-${task.startFrom}.`
                : 'Partira de la branche principale du dépôt.'}
            </p>
          </section>
          {task.mode === 'worker' && (
            <section
              aria-labelledby="guardrails-title"
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <h2 id="guardrails-title" className="mb-2 text-xs font-semibold text-muted">
                Garde-fous
              </h2>
              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Coût estimé</dt>
                  <dd className="font-mono text-xs">{usd(task.spentUsd)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tours</dt>
                  <dd className="font-mono text-xs">
                    {task.outcome.turns > 0 ? `${task.outcome.turns} sur ` : 'au plus '}
                    {task.guardrails.maxTurns}
                  </dd>
                </div>
                {task.outcome.branch && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Branche</dt>
                    <dd className="truncate font-mono text-xs" title={task.outcome.branch}>
                      {task.outcome.branch}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Outils</dt>
                  <dd className="text-right text-xs">{task.guardrails.tools?.join(', ') ?? 'ceux du dépôt'}</dd>
                </div>
              </dl>
            </section>
          )}
          <TaskLog log={task.log} />
        </aside>
      </div>
    </div>
  );
}

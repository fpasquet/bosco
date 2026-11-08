'use client';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { TaskDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { usd } from '../../lib/tasks';
import { TaskStateBadge } from '../task-state-badge';

const CLOCK = new Intl.DateTimeFormat('fr', { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' });

export interface TaskDetailProps {
  busy: boolean;
  /** Tâches qui échoueraient avec l'annulation : la confirmation les nomme (E13c) */
  failing: TaskDto[];
  onCancel: () => void;
  onRelaunch: (changes: { budgetUsd: number; fromBranch: boolean; instruction?: string }) => void;
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

function Relaunch({ busy, onRelaunch, task }: Pick<TaskDetailProps, 'busy' | 'onRelaunch' | 'task'>) {
  const [fromBranch, setFromBranch] = useState(true);
  const [budget, setBudget] = useState(Math.min(2, Number((task.guardrails.budgetUsd * 1.5).toFixed(2))));
  const [instruction, setInstruction] = useState('');
  return (
    <section
      aria-labelledby="relaunch-title"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 id="relaunch-title" className="font-semibold">
        Relancer
      </h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Point de départ</legend>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" checked={fromBranch} onChange={() => setFromBranch(true)} />
          Repartir de la branche (garde le travail déjà fait)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" checked={!fromBranch} onChange={() => setFromBranch(false)} />
          Repartir de zéro
        </label>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Budget ($)</span>
        <input
          type="number"
          min={0.1}
          step={0.1}
          className="input w-40"
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Consigne en plus (facultatif)</span>
        <textarea
          className="textarea w-full"
          rows={2}
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
      </label>
      <Button
        className="self-start"
        disabled={busy}
        onClick={() => onRelaunch({ budgetUsd: budget, fromBranch, instruction: instruction || undefined })}
      >
        Relancer
      </Button>
    </section>
  );
}

/** Détail d'une tâche (E13a, E13b, E13c) : ce qu'elle fait, ce qu'elle attend, son journal, et ce qu'on peut faire. */
export function TaskDetail({ busy, failing, onCancel, onRelaunch, task }: TaskDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const canCancel = !['cancelled', 'failed', 'rejected', 'validated'].includes(task.state);
  const failed = task.state === 'failed' || task.state === 'rejected';
  return (
    <div className="flex flex-col gap-4">
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
            {task.createdBy === 'session' ? ' · créée par une session' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {task.editable && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tasks/${task.id}/edit`}>Modifier</Link>
            </Button>
          )}
          {canCancel && (
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
      {failed && task.failure && (
        <p role="status" className="rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger">
          {task.failure}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4 md:col-span-2">
          <section
            aria-labelledby="instruction-title"
            className="rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <h2 id="instruction-title" className="mb-2 text-xs font-semibold text-muted">
              Consigne
            </h2>
            <p className="whitespace-pre-line">{task.instruction}</p>
            {task.context && <p className="mt-2 text-sm text-muted">Contexte : {task.context}</p>}
          </section>
          {task.outcome.report && (
            <section
              aria-labelledby="report-title"
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <h2 id="report-title" className="mb-2 text-xs font-semibold text-muted">
                Compte rendu de l’agent
              </h2>
              <p className="whitespace-pre-line">{task.outcome.report}</p>
            </section>
          )}
          {failed && <Relaunch busy={busy} onRelaunch={onRelaunch} task={task} />}
          <section aria-labelledby="log-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 id="log-title" className="mb-2 text-xs font-semibold text-muted">
              Journal
            </h2>
            <ol className="flex flex-col gap-1.5 text-sm">
              {task.log.map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="flex gap-3">
                  <time dateTime={entry.at} className="w-28 shrink-0 font-mono text-xs text-muted">
                    {CLOCK.format(new Date(entry.at))}
                  </time>
                  <span>
                    {entry.event}
                    {entry.detail && <span className="text-muted"> · {entry.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="flex flex-col gap-4">
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
                  <dt className="text-muted">Budget</dt>
                  <dd className="font-mono text-xs">
                    {usd(task.spentUsd)} / {usd(task.guardrails.budgetUsd)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tours</dt>
                  <dd className="font-mono text-xs">
                    {task.outcome.turns > 0 ? `${task.outcome.turns} / ` : ''}
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
        </aside>
      </div>
    </div>
  );
}

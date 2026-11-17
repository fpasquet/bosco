'use client';
import { Bot, Flag, OctagonAlert } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { TaskDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Bubble, BubbleContent } from '@/shared/ui/bubble';
import { Button } from '@/shared/ui/button';
import { Message, MessageContent, MessageHeader } from '@/shared/ui/message';
import { whyWaiting } from '../../lib/tasks';

const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });

export interface TaskThreadPanelProps {
  /** Modifications de la branche (diff) ; null : l'onglet est inactif (pas encore de branche, mode Ma session) */
  changes: ReactNode;
  /** Zone de message d'une tâche à relire : l'agent reprend sur la même branche (RF-TACH-10) */
  composer?: ReactNode;
  busy?: boolean;
  /** Annulation depuis la barre d'une tâche du worker en cours */
  onCancel?: () => void;
  task: TaskDto;
  /** Fil de la session de l'agent, fourni par la page ; null tant qu'il n'a pas démarré */
  thread: ReactNode;
}

/** Heure du dernier événement du journal de ce nom (« En échec », « Rejetée »). */
function lastAt(task: TaskDto, event: string): null | string {
  const entry = task.log.findLast((candidate) => candidate.event === event);
  return entry ? CLOCK.format(new Date(entry.at)) : null;
}

/** Ce que dit le fil d'une tâche qui n'a pas démarré : sa consigne, et ce qu'elle attend. */
function NotStarted({ task }: { task: TaskDto }) {
  const waiting = whyWaiting(task);
  return (
    <div className="flex flex-col gap-4">
      <Message align="end">
        <MessageContent>
          <MessageHeader>Consigne de la tâche · sera transmise au départ</MessageHeader>
          <Bubble variant="tinted">
            <BubbleContent className="whitespace-pre-line">{task.instruction}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <p className="self-center rounded-card bg-surface-alt px-3 py-2 text-center text-sm text-muted">
        L’agent n’a pas encore démarré{waiting ? ` · ${waiting}` : ' · en file, il part dès qu’une place se libère'}
      </p>
    </div>
  );
}

/**
 * Fil d'une tâche (RF-TACH-10, E13, E7) : comme pour une session, tout ce que fait l'agent, la consigne transmise en
 * tête, jusqu'à son compte rendu ou son arrêt ; l'onglet Modifications montre le diff de sa branche.
 */
export function TaskThreadPanel({ busy = false, changes, composer, onCancel, task, thread }: TaskThreadPanelProps) {
  const [tab, setTab] = useState<'changes' | 'thread'>('thread');
  const summary = task.outcome.changes;
  const live = task.state === 'running';
  const failedAt = lastAt(task, 'En échec');
  const rejectedAt = lastAt(task, 'Rejetée');
  return (
    <section
      aria-label={`Fil de T-${task.id}`}
      className="flex min-h-0 flex-1 flex-col rounded-card border border-line bg-surface shadow-card"
    >
      <div role="tablist" aria-label="Fil et modifications" className="tabs tabs-border border-b border-line px-2">
        <button
          type="button"
          role="tab"
          id="task-tab-thread"
          aria-selected={tab === 'thread'}
          aria-controls="task-panel-thread"
          className={cn('tab gap-2', tab === 'thread' ? 'tab-active' : 'text-muted opacity-100')}
          onClick={() => setTab('thread')}
        >
          {live && <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-info" />}
          {live ? 'Fil en direct' : 'Fil'}
        </button>
        <button
          type="button"
          role="tab"
          id="task-tab-changes"
          aria-selected={tab === 'changes'}
          aria-controls="task-panel-changes"
          disabled={changes === null}
          className={cn('tab gap-2', tab === 'changes' ? 'tab-active' : 'text-muted opacity-100')}
          onClick={() => setTab('changes')}
        >
          Modifications
          {summary && (
            <span className="font-mono text-xs">
              {summary.files} {summary.files > 1 ? 'fichiers' : 'fichier'} ·{' '}
              <span className="text-success">+{summary.added}</span>{' '}
              <span className="text-danger">−{summary.removed}</span>
            </span>
          )}
        </button>
      </div>
      <div
        role="tabpanel"
        id="task-panel-thread"
        aria-labelledby="task-tab-thread"
        hidden={tab !== 'thread'}
        tabIndex={0}
        className={cn('min-h-0 flex-1 overflow-y-auto p-4', tab !== 'thread' && 'hidden')}
      >
        <div className="flex flex-col gap-4">
          {task.outcome.sessionId ? thread : <NotStarted task={task} />}
          {task.outcome.report && ['to_review', 'validated'].includes(task.state) && (
            <section aria-labelledby="task-report" className="rounded-card border border-primary px-4 py-3">
              <h2 id="task-report" className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Flag aria-hidden className="size-3.5" />
                Compte rendu de l’agent
              </h2>
              <p className="mt-1 whitespace-pre-line">{task.outcome.report}</p>
              <p className="mt-1.5 text-xs text-muted">Tests déclarés par l’agent : Bosco ne les relance pas.</p>
            </section>
          )}
          {task.state === 'failed' && (
            <p
              role="status"
              className="flex items-center gap-2 rounded-card border border-danger bg-danger-soft px-4 py-2.5 text-danger"
            >
              <OctagonAlert aria-hidden className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">Arrêt : {task.failure ?? 'l’agent s’est arrêté avant la fin'}</span>
              {failedAt && <span className="font-mono text-xs tabular-nums">{failedAt}</span>}
            </p>
          )}
          {task.state === 'rejected' && (
            <p role="status" className="rounded-card bg-surface-alt px-4 py-2.5 text-muted">
              Rejetée{rejectedAt ? ` à ${rejectedAt}` : ''} : {task.failure}
            </p>
          )}
        </div>
      </div>
      <div
        role="tabpanel"
        id="task-panel-changes"
        aria-labelledby="task-tab-changes"
        hidden={tab !== 'changes'}
        tabIndex={0}
        className={cn('min-h-0 flex-1 overflow-y-auto p-4', tab !== 'changes' && 'hidden')}
      >
        {changes}
      </div>
      {live && task.mode === 'worker' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-alt px-4 py-3 text-sm text-muted">
          <Bot aria-hidden className="size-4 shrink-0" />
          <p className="min-w-0 flex-1">L’agent travaille seul · tu pourras lui écrire à la relecture</p>
          {onCancel && (
            <Button variant="outline" size="sm" disabled={busy} onClick={onCancel}>
              Annuler la tâche
            </Button>
          )}
        </div>
      )}
      {composer}
    </section>
  );
}

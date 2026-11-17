import type { TaskDto } from '@bosco/domain';

const CLOCK = new Intl.DateTimeFormat('fr', { day: 'numeric', hour: '2-digit', minute: '2-digit', month: 'short' });

/** Journal d'une tâche (E13a) : chaque changement d'état avec son heure, jamais vidé, reprises et relances comprises. */
export function TaskLog({ log }: { log: TaskDto['log'] }) {
  return (
    <section aria-labelledby="log-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="log-title" className="mb-2 text-xs font-semibold text-muted">
        Journal
      </h2>
      <ol className="flex flex-col gap-1.5 text-sm">
        {log.map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="flex gap-3">
            <time dateTime={entry.at} className="w-28 shrink-0 font-mono text-xs text-muted">
              {CLOCK.format(new Date(entry.at))}
            </time>
            <span className="min-w-0 wrap-break-word">
              {entry.event}
              {entry.detail && <span className="text-muted"> · {entry.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

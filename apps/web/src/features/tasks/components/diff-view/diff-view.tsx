import type { TaskChangesDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { parseDiff } from '../../lib/diff';

const LINE_STYLES = {
  added: 'bg-success-soft text-success',
  removed: 'bg-danger-soft text-danger',
  context: 'text-ink',
  hunk: 'bg-surface-alt text-muted',
} as const;

const MARKS = { added: '+', removed: '−', context: ' ', hunk: '' } as const;

/** Modifications d'une tâche (E7a, annotation 2) : fichiers touchés, puis le diff depuis le départ de sa branche. */
export function DiffView({ changes }: { changes: TaskChangesDto }) {
  const files = parseDiff(changes.diff);
  return (
    <div className="flex flex-col gap-3">
      <ul aria-label="Fichiers modifiés" className="flex flex-col gap-1">
        {changes.files.map((file) => (
          <li key={file.path} className="flex items-center gap-3 font-mono text-xs">
            <span className="min-w-0 flex-1 truncate">{file.path}</span>
            <span className="text-success">+{file.added}</span>
            <span className="text-danger">−{file.removed}</span>
          </li>
        ))}
      </ul>
      {files.map((file) => (
        <figure key={file.path} className="overflow-hidden rounded-control border border-line">
          <figcaption className="border-b border-line bg-surface-alt px-3 py-1.5 font-mono text-xs">
            {file.path}
          </figcaption>
          <div className="overflow-x-auto">
            <pre className="font-mono text-xs/5">
              {file.lines.map((line, index) => (
                <div key={index} className={cn('px-3 whitespace-pre', LINE_STYLES[line.kind])}>
                  <span aria-hidden className="inline-block w-4 select-none">
                    {MARKS[line.kind]}
                  </span>
                  {line.kind === 'added' && <span className="sr-only">ajouté : </span>}
                  {line.kind === 'removed' && <span className="sr-only">retiré : </span>}
                  {line.text}
                </div>
              ))}
            </pre>
          </div>
        </figure>
      ))}
      {changes.truncated && (
        <p className="text-xs text-muted">Diff coupé : la suite se lit dans la branche, avec ton éditeur.</p>
      )}
    </div>
  );
}

import { Copy } from 'lucide-react';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { cacheShare, durationEnd } from '../../lib/detail';
import { elapsed, formatCost, formatTokens, relativePath } from '../../lib/format';
import { totalTokens } from '../../lib/overview';

export interface SessionSideProps {
  now: Date;
  onCopy: (text: string, label: string) => void;
  /** Commande de reprise d'une session close ; null tant qu'elle est ouverte (RF-SESS-09) */
  resume: null | string;
  session: SessionDto;
}

/** « Opus 5.5 » d'après « claude-opus-5-5 » ; un modèle inconnu reste tel quel. */
function modelName(model: null | string): string {
  const match = model && /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model);
  if (!match) return model ?? '—';
  const [, family = '', major, minor] = match;
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-xs tabular-nums">{value}</dd>
    </div>
  );
}

/** Colonne du détail : usage estimé (RF-SESS-05), fichiers modifiés par l'agent, identifiant et reprise. */
export function SessionSide({ now, onCopy, resume, session }: SessionSideProps) {
  const closed = session.state === 'ended' || session.state === 'inactive';
  const { usage } = session;
  return (
    <aside className="flex flex-col gap-4">
      <section aria-labelledby="usage-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 id="usage-title" className="mb-3 text-xs font-semibold text-muted">
          Usage
        </h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <Row label="Modèle" value={modelName(session.model)} />
          {closed ? (
            <>
              <Row label="Tokens en entrée" value={formatTokens(usage.input)} />
              <Row label="Tokens en sortie" value={formatTokens(usage.output)} />
              <Row label="Cache lu" value={formatTokens(usage.cacheRead)} />
              <Row label="Cache écrit" value={formatTokens(usage.cacheCreation)} />
            </>
          ) : (
            <>
              <Row label="Tokens" value={formatTokens(totalTokens(usage))} />
              <Row label="Cache" value={`${cacheShare(usage)} %`} />
            </>
          )}
          <Row label="Coût estimé" value={formatCost(session.cost)} />
          <Row label="Durée" value={elapsed(new Date(session.startedAt), durationEnd(session, now))} />
          <Row label="Tours" value={String(session.turns)} />
        </dl>
      </section>
      <section aria-labelledby="branch-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 id="branch-title" className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted">
          Branche <span className="font-mono font-normal">{session.branch ?? '—'}</span>
        </h2>
        {session.changedFiles.length === 0 ? (
          <p className="text-xs text-muted">Aucun fichier modifié par l’agent.</p>
        ) : (
          <ul className="flex flex-col gap-1 font-mono text-xs">
            {session.changedFiles.map((file) => (
              <li key={file.path} className="flex gap-2">
                <span className="min-w-0 flex-1 truncate" title={file.path}>
                  {relativePath(file.path, session.repository?.root)}
                </span>
                <span className="text-success">+{file.added}</span>
                {file.removed > 0 && <span className="text-danger">−{file.removed}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">depuis le début de la session · hors commandes shell</p>
      </section>
      <section aria-labelledby="session-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 id="session-title" className="mb-3 text-xs font-semibold text-muted">
          Session
        </h2>
        <dl className="flex flex-col gap-1.5 text-sm">
          <Row label="Identifiant" value={session.id.slice(0, 8)} />
        </dl>
        {resume ? (
          <div className="mt-3 flex flex-col gap-2">
            <code className="rounded-control bg-surface-alt px-3 py-2 font-mono text-xs break-all">{resume}</code>
            <Button
              variant="outline"
              size="sm"
              className="self-start max-md:hidden"
              onClick={() => onCopy(resume, 'Commande de reprise copiée')}
            >
              <Copy aria-hidden className="size-3.5" />
              Copier la reprise
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">La commande de reprise apparaît quand la session est close.</p>
        )}
      </section>
    </aside>
  );
}

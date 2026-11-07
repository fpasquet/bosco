import type { SessionDto } from '@bosco/domain';

/** Ce qu'attend la session : la commande à autoriser, ou le dernier message de l'agent à la fin de son tour. */
export function WaitingSummary({ session }: { session: SessionDto }) {
  const { waiting } = session;
  if (!waiting) return null;
  if (waiting.kind === 'turn') {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted">Tour terminé</p>
        <p className="truncate">{waiting.message ? `« ${waiting.message} »` : 'L’agent a rendu la main.'}</p>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">Autorisation demandée</p>
      <p className="truncate">
        <span className="font-medium">{waiting.tool}</span>{' '}
        {waiting.detail && (
          <code className="rounded-sm bg-surface-alt px-1.5 py-0.5 font-mono text-xs">{waiting.detail}</code>
        )}
      </p>
    </div>
  );
}

import { Copy } from 'lucide-react';

/** Commande de reprise dans l'onglet « Projets » : entre deux tours, avec les autres projets de la session. */
export function ResumeCard({
  onCopy,
  resume,
}: {
  onCopy: (text: string, label: string) => void;
  resume: null | string;
}) {
  return (
    <section aria-labelledby="resume-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="resume-title" className="text-xs font-semibold text-muted">
        Reprendre dans un terminal
      </h2>
      {resume ? (
        <>
          <p className="mt-1 text-xs text-muted">Entre deux tours :</p>
          <div className="mt-2 flex items-start gap-2 rounded-control bg-surface-alt py-1 pr-1 pl-3">
            <code className="min-w-0 flex-1 py-1 font-mono text-xs break-all">{resume}</code>
            <button
              type="button"
              className="btn btn-square btn-ghost btn-sm"
              aria-label="Copier la commande"
              onClick={() => onCopy(resume, 'Commande de reprise copiée')}
            >
              <Copy aria-hidden className="size-4" />
            </button>
          </div>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">La commande de reprise apparaît entre deux tours.</p>
      )}
    </section>
  );
}

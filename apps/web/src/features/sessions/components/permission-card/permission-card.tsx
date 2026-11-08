'use client';
import { Check, Hand, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { SessionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import type { Settlement } from '../../lib/settlements';
import { clockOf } from '../../lib/detail';
import { elapsed } from '../../lib/format';

export interface PermissionCardProps {
  /** Ce que l'agent a dit juste avant de demander */
  agentSays: null | string;
  busy: boolean;
  now: Date;
  onAllow: () => void;
  onDeny: (reason: null | string) => void;
  session: SessionDto;
  /** Réponse déjà donnée ailleurs : la carte le dit et ses boutons disparaissent (CA-SESS-33) */
  settlement: null | Settlement;
}

/** Carte d'autorisation au bout du fil (E2b) : tout ce qu'il faut pour décider, sans quitter Bosco. */
export function PermissionCard({ agentSays, busy, now, onAllow, onDeny, session, settlement }: PermissionCardProps) {
  const { getValues, register } = useForm({ defaultValues: { reason: '' } });
  const waiting = session.waiting?.kind === 'permission' ? session.waiting : null;
  if (!waiting) {
    if (settlement?.outcome !== 'elsewhere') return null;
    return (
      <p className="mt-4 rounded-card border border-line bg-surface-alt px-4 py-3 text-muted">
        Répondu ailleurs à {clockOf(settlement.at)}
      </p>
    );
  }
  const folder = session.repository?.folder || session.repository?.name || session.repoPath;
  return (
    <section aria-label="Autorisation demandée" className="mt-4 rounded-card border border-warning bg-surface">
      <h3 className="flex items-center gap-2 rounded-t-card bg-warning-soft px-4 py-2.5 font-semibold text-warning">
        <Hand aria-hidden className="size-4" />
        Autorisation demandée
        <span className="ml-auto text-xs font-normal">il y a {elapsed(new Date(waiting.since), now)}</span>
      </h3>
      <div className="flex flex-col gap-3 p-4">
        {agentSays && <p className="text-muted">« {agentSays} »</p>}
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
          <span className="font-semibold text-ink">{waiting.tool}</span>
          {folder && <span className="font-mono">Dossier : {folder}</span>}
        </p>
        {waiting.detail && (
          <pre className="overflow-x-auto rounded-control bg-surface-alt px-3 py-2 font-mono text-xs">
            $ {waiting.detail}
          </pre>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Motif du refus (facultatif, transmis à l’agent)</span>
          <textarea
            className="textarea w-full"
            rows={2}
            {...register('reason')}
            placeholder="Utilise la base de test docker, pas la base locale."
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="max-md:btn-md"
            size="sm"
            disabled={busy}
            onClick={() => onDeny(getValues('reason').trim() || null)}
          >
            <X aria-hidden className="size-3.5" />
            Refuser
          </Button>
          <Button variant="primary" className="max-md:btn-md" size="sm" disabled={busy} onClick={onAllow}>
            <Check aria-hidden className="size-3.5" />
            Autoriser
          </Button>
          <span className="text-xs text-muted">Tu peux aussi répondre dans le terminal de la session.</span>
        </div>
      </div>
    </section>
  );
}

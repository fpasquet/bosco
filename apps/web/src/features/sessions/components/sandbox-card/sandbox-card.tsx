'use client';
import { Download, Moon, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PilotSandboxDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { clockOf } from '../../lib/detail';

export interface SandboxCardProps {
  /** Une action est en cours, ou un tour : la copie s'écrit encore */
  busy: boolean;
  onRemove: () => void;
  onRetrieve: () => void;
  onStop: () => void;
  sandbox: PilotSandboxDto;
}

const STATES = {
  running: { badge: 'badge-success', label: 'Démarré' },
  stopped: { badge: 'badge-ghost', label: 'En veille' },
  missing: { badge: 'badge-ghost', label: 'Supprimé' },
} as const;

/**
 * Bac à sable d'une session (E2j, règle 12) : l'état de son conteneur et son arrêt prévu, la branche de la session et
 * sa récupération dans le dépôt du poste, puis l'arrêt et la suppression, confirmée.
 */
export function SandboxCard({ busy, onRemove, onRetrieve, onStop, sandbox }: SandboxCardProps) {
  const [confirming, setConfirming] = useState(false);
  const state = sandbox.removed ? STATES.missing : STATES[sandbox.state];
  return (
    <section aria-labelledby="sandbox-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <h2 id="sandbox-title" className="text-xs font-semibold text-muted">
          Bac à sable
        </h2>
        <span className={`ml-auto badge badge-soft badge-sm ${state.badge}`}>{state.label}</span>
      </div>
      <p className="font-mono text-xs">{sandbox.branch}</p>
      <p className="mt-1 text-xs text-muted">
        depuis {sandbox.from} ·{' '}
        {sandbox.retrievedAt ? `récupérée à ${clockOf(sandbox.retrievedAt)}` : 'jamais récupérée'}
      </p>
      {sandbox.state === 'running' && !sandbox.removed && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <Moon aria-hidden className="size-3.5 shrink-0" />
          S’arrête à <span className="font-mono tabular-nums">{clockOf(sandbox.stopsAt)}</span> sans nouveau message
        </p>
      )}
      {sandbox.removed ? (
        <p className="mt-3 text-xs text-muted">Supprimé : la session reste lisible, mais ne se reprend plus.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <Button size="sm" disabled={busy} onClick={onRetrieve}>
            <Download aria-hidden className="size-4" />
            Récupérer la branche
          </Button>
          {sandbox.state === 'running' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onStop}>
              <Square aria-hidden className="size-3.5" />
              Arrêter le bac à sable
            </Button>
          )}
          {confirming ? (
            <div role="alert" className="flex flex-col gap-2 rounded-control bg-danger-soft p-3 text-xs text-danger">
              <p>
                Le conteneur et la copie du projet seront effacés
                {sandbox.retrievedAt ? '' : ' : la branche n’a jamais été récupérée'}. La session restera lisible.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={busy} onClick={onRemove}>
                  Supprimer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  Garder
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden className="size-3.5" />
              Supprimer le bac à sable
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

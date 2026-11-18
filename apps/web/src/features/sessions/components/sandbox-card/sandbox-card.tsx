'use client';
import { Database, Download, Moon, Square, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import type { PilotSandboxDto, UsageDto } from '@bosco/domain';
import { coresOf, memoryUsageOf } from '@/shared/lib/usage';
import { Button } from '@/shared/ui/button';
import { clockOf } from '../../lib/detail';

export interface SandboxCardProps {
  /** Une action est en cours, ou un tour : la copie s'écrit encore */
  busy: boolean;
  onRemove: () => void;
  /** « Récupérer la branche » ; absent pour une session à plusieurs projets, que la carte « Branches » récupère */
  onRetrieve?: () => void;
  onStop: () => void;
  sandbox: PilotSandboxDto;
  /** Consommation du conteneur démarré, mesurée avec les conteneurs en cours ; null avant la première mesure */
  usage?: null | UsageDto;
}

const SERVICE_STATES = {
  ready: { badge: 'badge-success', label: 'Prêt' },
  starting: { badge: 'badge-info', label: 'Démarre' },
  failed: { badge: 'badge-error', label: 'En échec' },
} as const;

/**
 * Services de données du projet (base, cache…), démarrés à côté de l'agent sur le réseau du bac à sable : il les joint
 * par leur nom. Un service en échec dit pourquoi.
 */
function DataServices({ services }: { services: PilotSandboxDto['services'] }) {
  if (services.services.length === 0 && !services.error) return null;
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-xs text-muted">Services de données</h3>
      {services.error && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {services.error}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {services.services.map((service) => (
          <li key={service.name} className="text-xs">
            <p className="flex items-center gap-1.5">
              <Database aria-hidden className="size-3.5 shrink-0 text-muted" />
              <span className="font-mono">{service.name}</span>
              <span className="min-w-0 truncate text-muted">{service.image}</span>
              <span className={`ml-auto badge badge-soft badge-sm ${SERVICE_STATES[service.state].badge}`}>
                {SERVICE_STATES[service.state].label}
              </span>
            </p>
            {service.error && <p className="mt-0.5 pl-5 text-warning">{service.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STATES = {
  running: { badge: 'badge-success', label: 'Démarré' },
  stopped: { badge: 'badge-ghost', label: 'En veille' },
  missing: { badge: 'badge-ghost', label: 'Supprimé' },
} as const;

/**
 * Bac à sable d'une session : l'état de son conteneur, ce qu'il consomme, ses services de données et son arrêt prévu, la branche de la session et
 * sa récupération dans le dépôt du poste, puis l'arrêt et la suppression, confirmée.
 */
export function SandboxCard({ busy, onRemove, onRetrieve, onStop, sandbox, usage = null }: SandboxCardProps) {
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
      {sandbox.state === 'running' && !sandbox.removed && usage && (
        <dl aria-label="Consommation du conteneur" className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-muted">Processeur</dt>
            <dd className="font-mono tabular-nums">{coresOf(usage)}</dd>
          </div>
          <div>
            <dt className="text-muted">Mémoire</dt>
            <dd className="font-mono tabular-nums">{memoryUsageOf(usage)}</dd>
          </div>
        </dl>
      )}
      {sandbox.state === 'running' && !sandbox.removed && <DataServices services={sandbox.services} />}
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
          {onRetrieve && (
            <Button size="sm" disabled={busy} onClick={onRetrieve}>
              <Download aria-hidden className="size-4" />
              Récupérer la branche
            </Button>
          )}
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

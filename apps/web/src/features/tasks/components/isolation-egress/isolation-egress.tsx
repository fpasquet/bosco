'use client';
import { KeyRound, Lock, ShieldAlert, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { IsolationDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { refusalTime } from '../../lib/isolation';

export interface IsolationEgressProps {
  busy: boolean;
  /** Refus de l'API pour le domaine saisi, affiché sous le champ */
  error: null | string;
  isolation: IsolationDto;
  now: Date;
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
}

function Card({ children, id, title }: { children: React.ReactNode; id: string; title: string }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <h2 id={id} className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Isolation du worker, sortie réseau et secrets (E11b) : les domaines qu'un agent peut joindre, les refus récents et
 * ce que chaque tâche reçoit comme secrets. Un domaine autorisé vaut tout de suite, sans relancer la tâche.
 */
export function IsolationEgress({ busy, error, isolation, now, onAdd, onRemove }: IsolationEgressProps) {
  const [draft, setDraft] = useState('');
  const { added, locked } = isolation.domains;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Card id="egress-domains" title="Domaines autorisés">
          <div className="flex flex-col gap-3 px-4 py-3">
            <div>
              <p className="text-xs text-muted">Par défaut · nécessaires à Claude Code et aux installations</p>
              <ul aria-label="Domaines par défaut" className="mt-2 flex flex-wrap gap-1.5">
                {locked.map((domain) => (
                  <li key={domain} className="badge gap-1 badge-ghost font-mono">
                    <Lock aria-hidden className="size-3" />
                    {domain}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-muted">Ajoutés par toi</p>
              {added.length === 0 ? (
                <p className="mt-2 text-muted">Aucun pour l’instant.</p>
              ) : (
                <ul aria-label="Domaines ajoutés" className="mt-2 flex flex-wrap gap-1.5">
                  {added.map((domain) => (
                    <li key={domain} className="badge gap-1 badge-outline font-mono">
                      {domain}
                      <button
                        type="button"
                        aria-label={`Retirer ${domain}`}
                        className="hidden cursor-pointer md:inline-flex"
                        disabled={busy}
                        onClick={() => onRemove(domain)}
                      >
                        <X aria-hidden className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form
              className="hidden flex-col gap-1 md:flex"
              onSubmit={(event) => {
                event.preventDefault();
                if (draft.trim()) onAdd(draft);
              }}
            >
              <label htmlFor="egress-domain" className="text-xs font-medium">
                Ajouter un domaine
              </label>
              <div className="flex gap-2">
                <input
                  id="egress-domain"
                  className="input flex-1 font-mono input-sm"
                  placeholder="pypi.org"
                  aria-describedby="egress-domain-hint"
                  aria-invalid={error ? true : undefined}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button type="submit" size="sm" variant="outline" disabled={busy || !draft.trim()}>
                  Ajouter
                </Button>
              </div>
              <p id="egress-domain-hint" className={error ? 'text-xs text-danger' : 'text-xs text-muted'}>
                {error ?? '*.domaine couvre les sous-domaines.'}
              </p>
            </form>
          </div>
        </Card>
        <p role="note" className="flex items-start gap-2 rounded-card bg-warning-soft px-4 py-3 text-warning">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          Le filtrage se fait par nom de domaine : un domaine autorisé reste une sortie possible.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Card id="egress-refusals" title="Refus récents">
          {isolation.refusals.length === 0 ? (
            <p className="px-4 py-3 text-muted">Aucun refus récent : les agents n’ont rien tenté hors de la liste.</p>
          ) : (
            <ul className="divide-y divide-line">
              {isolation.refusals.map((refusal) => (
                <li key={`${refusal.taskId}-${refusal.host}`} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <span className="w-24 text-xs text-muted tabular-nums">{refusalTime(refusal.at, now)}</span>
                  <Link href={`/tasks/${refusal.taskId}`} className="link font-mono text-xs">
                    T-{refusal.taskId}
                  </Link>
                  <span className="min-w-0 flex-1 truncate font-mono">{refusal.host}</span>
                  <Button
                    size="xs"
                    variant="outline"
                    className="hidden md:inline-flex"
                    disabled={busy}
                    aria-label={`Autoriser ce domaine : ${refusal.host}`}
                    onClick={() => onAdd(refusal.host)}
                  >
                    Autoriser ce domaine
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card id="egress-secrets" title="Secrets transmis à chaque tâche">
          <ul className="divide-y divide-line">
            <li className="flex items-start gap-3 px-4 py-3">
              <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Abonnement Claude</p>
                <p className="text-muted">Copie temporaire de l’accès, supprimée à la fin de la tâche.</p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-4 py-3">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <div>
                <p className="font-medium">Jamais transmis</p>
                <p className="text-muted">Tes autres accès, les réglages du poste.</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

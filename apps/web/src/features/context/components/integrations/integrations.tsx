'use client';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { IntegrationDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';

const NAMES: Record<IntegrationDto['name'], { label: string; reads: string }> = {
  github: { label: 'GitHub', reads: 'PR, tickets, commits, branches' },
  atlassian: { label: 'Jira et Confluence', reads: 'Reconnus à leur adresse : clé du ticket, titre de la page' },
};

const STATES: Record<IntegrationDto['state'], { badge: string; label: string }> = {
  agents: { label: 'Par les agents', badge: 'badge-ghost' },
  connected: { label: 'Connecté', badge: 'badge-soft badge-success' },
  error: { label: 'En erreur', badge: 'badge-soft badge-error' },
  unconfigured: { label: 'Non configuré', badge: 'badge-ghost' },
};

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export interface IntegrationsProps {
  busy: boolean;
  integrations: IntegrationDto[];
  lastRefresh: null | string;
  nextRefresh: null | string;
  onRefresh: () => void;
}

/**
 * Intégrations (E10a) : l'état de la connexion à GitHub, ce qu'elle lit, le nombre de liens et leur relecture ; Jira et
 * Confluence sont reconnus à leur adresse et lus par les agents du worker (E11b). Les accès restent dans Bosco.
 */
export function Integrations({ busy, integrations, lastRefresh, nextRefresh, onRefresh }: IntegrationsProps) {
  // Sur le téléphone, une intégration en erreur passe en tête
  const ordered = integrations.toSorted((a, b) => Number(b.state === 'error') - Number(a.state === 'error'));
  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="integrations-title" className="rounded-card border border-line bg-surface shadow-card">
        <h2 id="integrations-title" className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
          Intégrations
        </h2>
        <ul className="divide-y divide-line">
          {ordered.map((integration) => {
            const { label, reads } = NAMES[integration.name];
            const state = STATES[integration.state];
            return (
              <li key={integration.name}>
                <div className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{label}</span>
                      <span className={cn('badge badge-sm', state.badge)}>{state.label}</span>
                      <span className="font-mono text-xs text-muted">{integration.address}</span>
                    </p>
                    <p className="text-sm text-muted">{reads}</p>
                    {integration.state === 'error' && (
                      <p className="text-sm text-danger">
                        {integration.error}
                        {integration.links > 0 &&
                          ` : ${integration.links} lien${integration.links > 1 ? 's ne sont' : ' n’est'} plus rafraîchi${integration.links > 1 ? 's' : ''}`}
                      </p>
                    )}
                    {integration.checkedAt && integration.state === 'connected' && (
                      <p className="text-xs text-muted">Vérifié à {TIME.format(new Date(integration.checkedAt))}</p>
                    )}
                    {integration.name === 'github' && (
                      <p className="text-xs text-muted">Lu avec GitHub CLI du poste : aucun jeton n’est gardé.</p>
                    )}
                    {integration.name === 'atlassian' && (
                      <p className="text-xs text-muted">
                        Lus par les agents du worker avec ton connecteur Atlassian de claude.ai : Bosco ne garde aucun
                        accès.
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-muted">
                    {integration.links} lien{integration.links > 1 ? 's' : ''}
                  </span>
                  {integration.name === 'atlassian' && (
                    <Button asChild size="xs" variant="outline" className="hidden md:inline-flex">
                      <Link href="/settings/isolation/egress">Lecture par les agents</Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          Toute autre adresse est acceptée : elle est gardée avec le titre de la page seulement.
        </p>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-labelledby="links-refresh"
          className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card"
        >
          <h2 id="links-refresh" className="text-xs font-semibold text-muted">
            Liens enrichis
          </h2>
          <p className="text-sm">
            Titre, état et auteur sont relus toutes les heures. Un lien est gardé même si ses informations ne peuvent
            plus être lues.
          </p>
          <p className="text-xs text-muted">
            Dernier {lastRefresh ? TIME.format(new Date(lastRefresh)) : '—'} · Prochain{' '}
            {nextRefresh ? TIME.format(new Date(nextRefresh)) : 'dans l’heure'}
          </p>
          <Button size="sm" variant="outline" className="self-start" disabled={busy} onClick={onRefresh}>
            <RefreshCw aria-hidden className="size-3.5" />
            Rafraîchir maintenant
          </Button>
        </section>
        <section className="flex items-start gap-3 rounded-card border border-line bg-surface-alt p-4">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm">
            <b className="font-semibold">Ces accès restent dans Bosco.</b> L’accès à GitHub n’est jamais transmis aux
            agents : ils reçoivent le titre, l’état et l’adresse des liens d’une tâche, et lisent eux-mêmes ceux de Jira
            et Confluence si la lecture est activée.
          </p>
        </section>
      </div>
    </div>
  );
}

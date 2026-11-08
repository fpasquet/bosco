'use client';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { IntegrationDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';

const NAMES: Record<IntegrationDto['name'], { label: string; reads: string }> = {
  github: { label: 'GitHub', reads: 'PR, tickets, commits, branches' },
  jira: { label: 'Jira', reads: 'Tickets : titre, état, responsable' },
  confluence: { label: 'Confluence', reads: 'Pages : titre, version' },
};

const STATES: Record<IntegrationDto['state'], { badge: string; label: string }> = {
  connected: { label: 'Connecté', badge: 'badge-soft badge-success' },
  error: { label: 'En erreur', badge: 'badge-soft badge-error' },
  unconfigured: { label: 'Non configuré', badge: 'badge-ghost' },
};

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export interface IntegrationsProps {
  busy: boolean;
  error: null | string;
  integrations: IntegrationDto[];
  lastRefresh: null | string;
  nextRefresh: null | string;
  onConfigure: (name: 'confluence' | 'jira', access: { baseUrl: string; email: string; token: string }) => void;
  onRefresh: () => void;
}

function AccessForm({
  busy,
  error,
  integration,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error: null | string;
  integration: IntegrationDto;
  onCancel: () => void;
  onSubmit: (access: { baseUrl: string; email: string; token: string }) => void;
}) {
  const { handleSubmit, register } = useForm({
    defaultValues: { baseUrl: integration.address ?? '', email: '', token: '' },
  });
  const id = `access-${integration.name}`;
  return (
    <form
      className="flex flex-col gap-2 border-t border-line px-4 py-3"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium">Adresse du site</span>
        <input
          id={`${id}-url`}
          className="input w-full font-mono input-sm"
          placeholder="https://equipe.atlassian.net"
          {...register('baseUrl')}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium">Compte</span>
        <input className="input w-full input-sm" autoComplete="email" {...register('email')} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium">Jeton d’API</span>
        <input type="password" className="input w-full input-sm" autoComplete="off" {...register('token')} />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Enregistrer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/**
 * Intégrations (E10a) : l'état de chaque connexion, ce qu'elle lit, le nombre de liens et leur relecture. Les accès
 * restent dans Bosco, jamais chez les agents.
 */
export function Integrations({
  busy,
  error,
  integrations,
  lastRefresh,
  nextRefresh,
  onConfigure,
  onRefresh,
}: IntegrationsProps) {
  const [editing, setEditing] = useState<'confluence' | 'jira' | null>(null);
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
            const manageable = integration.name !== 'github';
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
                  </div>
                  <span className="text-sm text-muted">
                    {integration.links} lien{integration.links > 1 ? 's' : ''}
                  </span>
                  {manageable && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="hidden md:inline-flex"
                      disabled={busy}
                      onClick={() => setEditing(integration.name as 'confluence' | 'jira')}
                    >
                      {integration.state === 'error' ? 'Renouveler le jeton' : 'Gérer'}
                    </Button>
                  )}
                  {manageable && integration.state === 'error' && (
                    <span className="text-xs text-muted md:hidden">Renouveler sur le poste</span>
                  )}
                </div>
                {editing === integration.name && (
                  <AccessForm
                    integration={integration}
                    busy={busy}
                    error={error}
                    onCancel={() => setEditing(null)}
                    onSubmit={(access) => {
                      onConfigure(integration.name as 'confluence' | 'jira', access);
                      setEditing(null);
                    }}
                  />
                )}
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
            <b className="font-semibold">Ces accès restent dans Bosco.</b> Les accès à GitHub, Jira et Confluence ne
            sont jamais transmis aux agents : ils ne reçoivent que le titre, l’état et l’adresse des liens d’une tâche.
          </p>
        </section>
      </div>
    </div>
  );
}

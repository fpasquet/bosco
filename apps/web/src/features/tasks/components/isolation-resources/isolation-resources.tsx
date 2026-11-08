import { Box, Lock } from 'lucide-react';
import type { IsolationDto } from '@bosco/domain';
import { gigabytes } from '../../lib/isolation';

export interface IsolationResourcesProps {
  busy: boolean;
  isolation: IsolationDto;
  onMaxAgents: (agents: number) => void;
}

/** Ce que voit l'agent : fichiers, secrets, réseau (CA-CONT). */
const VISIBILITY = [
  {
    kind: 'Fichiers',
    granted: 'Sa copie du dépôt, un dossier personnel temporaire',
    denied: 'Tes autres dépôts, tes réglages, Bosco',
  },
  {
    kind: 'Secrets',
    granted: 'Accès Claude temporaire, copie du .npmrc du poste',
    denied: 'Accès GitHub, Jira, Confluence, tes autres accès, les réglages du poste',
  },
  { kind: 'Réseau', granted: 'Domaines autorisés', denied: 'Le reste d’Internet' },
] as const;

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  const id = `isolation-${title.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <h2 id={id} className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Value({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/**
 * Isolation du worker, mode et ressources (E11a) : un conteneur jetable par tâche, ce que l'agent voit, les limites
 * de chaque agent et la capacité du worker. Sur le téléphone, en lecture seule.
 */
export function IsolationResources({ busy, isolation, onMaxAgents }: IsolationResourcesProps) {
  const { capacity, limits } = isolation;
  const [min, max] = capacity.maxAgentsRange;
  const choices = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <Box aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="font-semibold">Conteneur jetable</h2>
          <p className="text-muted">
            Chaque tâche tourne dans son conteneur, avec une copie du dépôt et un dossier personnel temporaires,
            supprimés à la fin. Seule la branche reste.
          </p>
        </div>
      </section>
      <Card title="Ce que voit l’agent">
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead className="text-ink">
              <tr>
                <th scope="col">
                  <span className="sr-only">Quoi</span>
                </th>
                <th scope="col">A accès</th>
                <th scope="col">N’a pas accès</th>
              </tr>
            </thead>
            <tbody>
              {VISIBILITY.map(({ denied, granted, kind }) => (
                <tr key={kind}>
                  <th scope="row" className="font-medium">
                    {kind}
                  </th>
                  <td>{granted}</td>
                  <td className="text-muted">{denied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 px-4 py-3 md:hidden">
          <p>
            <b className="font-semibold">Accès :</b> {VISIBILITY.map(({ granted }) => granted.toLowerCase()).join(', ')}
            .
          </p>
          <p className="text-muted">
            <b className="font-semibold text-ink">Pas d’accès :</b>{' '}
            {VISIBILITY.map(({ denied }) => denied.toLowerCase()).join(', ')}.
          </p>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Ressources par agent">
          <dl className="divide-y divide-line">
            <Value label="Mémoire" value={gigabytes(limits.memory)} />
            <Value label="Processeurs" value={limits.cpus} />
            <Value label="Processus" value={limits.processes} />
            <Value
              label="Utilisateur"
              value={
                <span className="flex items-center gap-1.5">
                  <Lock aria-hidden className="size-3.5 text-muted" />
                  sans droits d’administration
                </span>
              }
            />
          </dl>
        </Card>
        <Card title="Capacité du worker">
          <dl className="divide-y divide-line">
            <Value
              label="Agents en même temps"
              value={
                <>
                  <select
                    aria-label="Agents en même temps"
                    className="select hidden w-32 select-sm md:inline-flex"
                    disabled={busy}
                    value={capacity.maxAgents}
                    onChange={(event) => onMaxAgents(Number(event.target.value))}
                  >
                    {choices.map((agents) => (
                      <option key={agents} value={agents}>
                        {agents} au plus
                      </option>
                    ))}
                  </select>
                  <span className="md:hidden">{capacity.maxAgents} au plus</span>
                </>
              }
            />
            <Value label="Mémoire gardée libre" value={gigabytes(capacity.reservedMemory)} />
            <Value label="Disponible maintenant" value={gigabytes(capacity.freeMemory)} />
          </dl>
        </Card>
      </div>
      <p className="text-xs text-muted">
        Image : <span className="font-mono">{isolation.image}</span> (Claude Code, git, Node, Python, ripgrep).
      </p>
    </div>
  );
}

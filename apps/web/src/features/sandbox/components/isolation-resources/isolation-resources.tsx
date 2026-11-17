import { Box, Lock } from 'lucide-react';
import type { IsolationDto } from '@bosco/domain';
import { gigabytes } from '../../lib/isolation';

export interface IsolationResourcesProps {
  isolation: IsolationDto;
}

/** Ce que voit l'agent : fichiers, secrets, réseau (CA-CONT). */
const VISIBILITY = [
  {
    kind: 'Fichiers',
    granted: 'Sa copie du dépôt, son dossier personnel, ses conversations',
    denied: 'Tes autres dépôts, tes réglages, Bosco',
  },
  {
    kind: 'Secrets',
    granted: 'L’accès à l’abonnement Claude de la session',
    denied: 'Accès GitHub, .npmrc, tes connecteurs et accès, les réglages du poste',
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
 * Isolation du bac à sable, mode et ressources (E11) : un conteneur par session, ce que l'agent voit et les limites de
 * chaque bac à sable. Sur le téléphone, en lecture seule.
 */
export function IsolationResources({ isolation }: IsolationResourcesProps) {
  const { limits } = isolation;
  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <Box aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="font-semibold">Un conteneur par session</h2>
          <p className="text-muted">
            Une session en bac à sable tourne dans son conteneur, sur sa copie du dépôt et sa branche. Le conteneur
            s’arrête après 30 minutes sans message ; la copie reste jusqu’à ce que tu récupères la branche.
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
      <Card title="Ressources de chaque bac à sable">
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
      <p className="text-xs text-muted">
        Image : <span className="font-mono">{isolation.image}</span> (Claude Code, git, Node, Python, ripgrep).
      </p>
    </div>
  );
}

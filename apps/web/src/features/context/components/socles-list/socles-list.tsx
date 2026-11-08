'use client';
import { Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { SocleDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { titleOf } from '../../lib/decisions';

const SHOWN = 3;

/** « s’applique aux 15 dépôts » pour un socle global, « 12 dépôts » pour un socle partagé. */
function countOf(socle: SocleDto): string {
  const count = socle.applied.length;
  const repositories = count > 1 ? `${count} dépôts` : `${count} dépôt`;
  if (socle.scope === 'shared') return repositories;
  return count > 1 ? `s’applique aux ${repositories}` : `s’applique à ${repositories}`;
}

function Repositories({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? names : names.slice(0, SHOWN);
  return (
    <ul aria-label="Dépôts" className="flex flex-wrap items-center gap-1.5">
      {shown.map((name) => (
        <li key={name} className="badge badge-outline font-mono badge-sm">
          {name}
        </li>
      ))}
      {!open && names.length > SHOWN && (
        <li>
          <button type="button" className="link text-xs" onClick={() => setOpen(true)}>
            + {names.length - SHOWN} autres
          </button>
        </li>
      )}
    </ul>
  );
}

/**
 * Socles (E14a) : pour chacun ses décisions, les dépôts qui en héritent et les exceptions locales. Les socles
 * s'empilent dans le contexte d'un dépôt ; un socle global s'applique à tous.
 */
export function SoclesList({ socles }: { socles: SocleDto[] }) {
  if (socles.length === 0)
    return (
      <p className="text-muted">
        Aucun socle pour l’instant : un socle regroupe des décisions communes à plusieurs dépôts.
      </p>
    );
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {socles.map((socle) => {
        const parent = socles.find(({ id }) => id === socle.inherits);
        return (
          <section
            key={socle.id}
            aria-labelledby={`socle-${socle.id}`}
            className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <div>
              <h2 id={`socle-${socle.id}`} className="flex flex-wrap items-center gap-2 font-semibold">
                {socle.name}
                <span className="badge badge-ghost badge-sm">{socle.scope === 'global' ? 'global' : 'partagé'}</span>
              </h2>
              <p className="text-xs text-muted">
                {socle.decisions.length} décision{socle.decisions.length > 1 ? 's' : ''} · {countOf(socle)}
                {parent ? ` · hérite de ${parent.name}` : ''}
              </p>
            </div>
            {socle.decisions.length === 0 ? (
              <p className="text-sm text-muted">Sans décision acceptée, il n’a aucun effet.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {socle.decisions.map((decision) => (
                  <li key={decision.id}>
                    <Link href={`/context/decisions/${decision.id}`} className="link-hover">
                      {titleOf(decision)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {socle.scope === 'shared' && <Repositories names={socle.applied} />}
            {socle.exceptions.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-muted">
                {socle.exceptions.map(({ decision, replaces, repository }) => (
                  <li key={decision.id}>
                    {repository} : DEC-{decision.id} fait exception à « {titleOf(replaces)} »
                  </li>
                ))}
              </ul>
            )}
            <div className="hidden flex-wrap gap-2 md:flex">
              <Button asChild variant="outline" size="sm">
                <Link href={`/context/socles/${socle.id}/edit`}>
                  <Pencil aria-hidden className="size-4" />
                  Modifier le socle<span className="sr-only"> {socle.name}</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-muted">
                <Link href={`/context/decisions/new?socle=${socle.id}`}>
                  <Plus aria-hidden className="size-4" />
                  Nouvelle décision<span className="sr-only"> du socle {socle.name}</span>
                </Link>
              </Button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

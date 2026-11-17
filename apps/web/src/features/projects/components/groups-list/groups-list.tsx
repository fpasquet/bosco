import { EyeOff, Layers } from 'lucide-react';
import Link from 'next/link';
import { useId } from 'react';
import type { GroupDto } from '@bosco/domain';
import { projectsLabel } from '../../lib/groups';

export interface GroupsListProps {
  groups: GroupDto[];
}

function detailOf(group: GroupDto): string {
  if (group.system) return `${projectsLabel(group.projects.length)} · instructions seulement`;
  return [projectsLabel(group.projects.length), group.description].filter(Boolean).join(' · ');
}

/**
 * Groupes qui réunissent les projets, chacun ouvrant sa page ; un groupe masqué de la barre latérale le dit d'un œil
 * barré. « Tous les projets », qui les contient tous et n'a que des instructions, vient en dernier.
 */
export function GroupsList({ groups }: GroupsListProps) {
  const id = useId();
  const own = groups.filter((group) => !group.system);
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <h2 id={id} className="text-xs font-semibold text-muted">
          Groupes
        </h2>
        <span className="badge badge-ghost font-mono badge-sm">{own.length}</span>
      </div>
      <ul aria-labelledby={id} className="divide-y divide-line">
        {groups.map((group) => (
          <li key={group.id} className={group.system ? 'bg-surface-alt' : undefined}>
            <Link href={`/groups/${group.id}`} className="flex items-center gap-3 px-4 py-2.5 link-hover">
              <Layers aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{group.name}</span>
                <span className="block truncate text-xs text-muted">{detailOf(group)}</span>
              </span>
              {!group.system && !group.sidebar && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <EyeOff aria-hidden className="size-3.5" />
                  hors barre latérale
                </span>
              )}
            </Link>
          </li>
        ))}
        {own.length === 0 && (
          <li className="px-4 py-3 text-muted">Aucun groupe pour l’instant : un groupe réunit des projets.</li>
        )}
      </ul>
    </section>
  );
}

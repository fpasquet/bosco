import { ChevronRight, Layers } from 'lucide-react';
import Link from 'next/link';
import type { GroupDto } from '@bosco/domain';
import { projectsLabel } from '../../lib/groups';

export type GroupTab = 'instructions' | 'settings';

export interface GroupHeaderProps {
  group: GroupDto;
  tab: GroupTab;
}

/** En-tête de la page d'un groupe : sa place (« Groupes › Club des Trois Lacs »), son nom et ses onglets. */
export function GroupHeader({ group, tab }: GroupHeaderProps) {
  // « Tous les projets » n'a que des instructions
  const tabs = [
    { key: 'instructions', label: 'Instructions' },
    ...(group.system ? [] : [{ key: 'settings', label: 'Réglages' }]),
  ] as const;
  return (
    <header className="flex flex-col gap-3">
      <div>
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-1 text-xs text-muted">
          <Link href="/projects" className="link link-hover">
            Groupes
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          {group.name}
        </nav>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <Layers aria-hidden className="size-5 text-muted" />
          {group.name}
        </h1>
        <p className="text-xs text-muted">
          {[group.description, projectsLabel(group.projects.length)].filter(Boolean).join(' · ')}
        </p>
      </div>
      <nav aria-label="Onglets du groupe" className="tabs tabs-box w-fit tabs-sm">
        {tabs.map(({ key, label }) => (
          <Link
            key={key}
            href={`/groups/${group.id}/${key}`}
            className={key === tab ? 'tab tab-active' : 'tab text-muted opacity-100'}
            aria-current={key === tab ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

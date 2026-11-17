import type { ReactNode } from 'react';
import { Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import type { GroupDto } from '@bosco/domain';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { LinkTabs } from '@/shared/ui/link-tabs';
import { projectsLabel } from '../../lib/groups';

export type GroupTab = 'instructions' | 'sessions' | 'settings';

export interface GroupHeaderProps {
  group: GroupDto;
  /** Menu ⋯ du groupe, le même que dans la barre latérale ; absent sur le téléphone */
  menu?: ReactNode;
  tab: GroupTab;
}

/**
 * En-tête de la page d'un groupe : sa place (« Groupes › Club des Trois Lacs »), son nom, « Nouvelle session
 * dans ce groupe », le menu ⋯ et ses onglets. « Tous les projets » n'a que ses instructions.
 */
export function GroupHeader({ group, menu, tab }: GroupHeaderProps) {
  const base = `/groups/${group.id}`;
  const tabs = group.system
    ? [{ href: `${base}/instructions`, label: 'Instructions' }]
    : [
        { href: `${base}/sessions`, label: 'Sessions' },
        { href: `${base}/instructions`, label: 'Instructions' },
        { href: `${base}/settings`, label: 'Réglages' },
      ];
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <Breadcrumbs items={[{ href: '/projects', label: 'Groupes' }, { label: group.name }]} />
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
            <Layers aria-hidden className="size-5 text-muted" />
            {group.name}
          </h1>
          <p className="text-xs text-muted">
            {[group.description, projectsLabel(group.projects.length)].filter(Boolean).join(' · ')}
          </p>
        </div>
        {!group.system && (
          <div className="flex w-full items-center gap-2 md:ml-auto md:w-auto">
            <Link href={`/sessions/new?group=${group.id}`} className="btn flex-1 btn-primary md:flex-none">
              <Plus aria-hidden className="size-4" />
              Nouvelle session dans ce groupe
            </Link>
            {menu && <span className="hidden md:inline-flex">{menu}</span>}
          </div>
        )}
      </div>
      <LinkTabs label="Onglets du groupe" current={`${base}/${tab}`} tabs={tabs} />
    </header>
  );
}

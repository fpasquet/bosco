import { FolderGit2, SquareTerminal } from 'lucide-react';
import Link from 'next/link';

export interface SessionsSidebarProps {
  liveTracking: boolean;
  profiles: { count: number; label: string; path: string }[];
  repositories: { count: number; name: string }[];
  /** Dépôt filtré (E1c) : son lien porte aria-current */
  selected: null | string;
}

const ITEM =
  'flex h-8 items-center gap-3 rounded-control px-2.5 aria-current:bg-nav-active aria-current:font-medium aria-current:text-nav-ink';
const HEADING = 'mt-6 px-2.5 text-xs font-semibold tracking-wider uppercase';

/** Dépôts, profils et état des sources dans la barre latérale ; un clic sur un dépôt filtre la vue d'ensemble. */
export function SessionsSidebar({ liveTracking, profiles, repositories, selected }: SessionsSidebarProps) {
  return (
    <>
      {repositories.length > 0 && (
        <>
          <p id="sidebar-repositories" className={HEADING}>
            Dépôts
          </p>
          <nav aria-labelledby="sidebar-repositories" className="mt-1.5 flex flex-col gap-0.5">
            {repositories.map(({ count, name }) => (
              <Link
                key={name}
                href={`/?repo=${encodeURIComponent(name)}`}
                aria-current={selected === name ? 'page' : undefined}
                className={ITEM}
              >
                <FolderGit2 aria-hidden className="size-4" />
                <span className="truncate">{name}</span>
                <span className="ml-auto font-mono text-xs">{count}</span>
              </Link>
            ))}
          </nav>
        </>
      )}
      <p id="sidebar-profiles" className={HEADING}>
        Profils Claude Code
      </p>
      <ul aria-labelledby="sidebar-profiles" className="mt-1.5 flex flex-col gap-0.5">
        {profiles.map(({ count, label, path }) => (
          <li key={path} className="flex h-8 items-center gap-3 px-2.5">
            <SquareTerminal aria-hidden className="size-4" />
            {label}
            <span className="truncate font-mono text-xs">{path}</span>
            <span className="ml-auto font-mono text-xs">{count}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-line px-2 pt-3 text-xs/relaxed">
        <p className="flex items-center gap-2 font-medium text-nav-ink">
          <span aria-hidden className="size-2 rounded-full bg-success" />
          {profiles.length > 1 ? `${profiles.length} sources surveillées` : '1 source surveillée'}
        </p>
        <p>{liveTracking ? 'Suivi en direct actif' : 'Suivi en direct non installé'}</p>
      </div>
    </>
  );
}

import type { ReactNode } from 'react';
import { Folder, FolderGit2, FolderOpen, Layers, List, Plus } from 'lucide-react';
import Link from 'next/link';

/** Une ligne de la barre latérale : ses sessions ouvertes et celles qui t'attendent. */
export interface SidebarActivity {
  count: number;
  waiting: number;
}

export interface SidebarPlacesProps {
  /** Ligne active : la page du projet ou du groupe ouvert, ou « Tous les projets » */
  active: { group: null | number; project: null | number; projects: boolean };
  /** Nombre de projets ajoutés, compteur de « Tous les projets » */
  allProjects: number;
  groupMenu: (id: number) => ReactNode;
  /** Groupes affichés dans la barre latérale, dans leur ordre */
  groups: (SidebarActivity & { id: number; name: string })[];
  onBrowse: () => void;
  onNewGroup: () => void;
  /** Sessions ouvertes hors de tout projet */
  outside: SidebarActivity;
  projectMenu: (id: number) => ReactNode;
  /** Projets épinglés ou qui ont une session ouverte */
  projects: (SidebarActivity & { git: boolean; id: number; name: string })[];
}

const ROW =
  'group/nav flex h-8 items-center gap-1 rounded-control pr-1 has-aria-current:bg-nav-active has-aria-current:font-medium has-aria-current:text-nav-ink has-aria-expanded:bg-nav-active';
const LINK = 'flex h-full min-w-0 flex-1 items-center gap-3 rounded-control pl-2.5 focus-ring';
const HEADING = 'mt-5 flex items-center pr-1 pl-2.5';
const TITLE = 'text-xs font-semibold tracking-wider uppercase';
const PLUS = 'ml-auto grid size-6 place-items-center rounded-control text-nav-muted hover:text-nav-ink focus-ring';

function Count({ count, waiting }: SidebarActivity) {
  if (count === 0) return null;
  return (
    <span className="ml-auto flex items-center gap-1.5 pl-1 font-mono text-xs">
      {waiting > 0 && (
        <>
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />
          <span className="sr-only">{waiting > 1 ? `${waiting} t’attendent, ` : '1 t’attend, '}</span>
        </>
      )}
      {count}
    </span>
  );
}

/**
 * Groupes et projets de la barre latérale : chaque ligne ouvre sa page, son bouton ⋯ ouvre son menu sans
 * quitter la page. Les ＋ des intitulés créent un groupe et ajoutent des projets ; « Tous les projets » les liste tous,
 * « Hors projet » compte les sessions hors de tout projet.
 */
export function SidebarPlaces({
  active,
  allProjects,
  groupMenu,
  groups,
  onBrowse,
  onNewGroup,
  outside,
  projectMenu,
  projects,
}: SidebarPlacesProps) {
  return (
    <>
      <div className={HEADING}>
        <p id="sidebar-groups" className={TITLE}>
          Groupes
        </p>
        <button type="button" aria-label="Créer un groupe" className={PLUS} onClick={onNewGroup}>
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {groups.length > 0 && (
        <nav aria-labelledby="sidebar-groups" className="mt-1">
          <ul className="flex flex-col gap-0.5">
            {groups.map(({ count, id, name, waiting }) => (
              <li key={id} className={ROW}>
                <Link
                  href={`/groups/${id}/sessions`}
                  aria-current={active.group === id ? 'page' : undefined}
                  className={LINK}
                >
                  <Layers aria-hidden className="size-4 shrink-0" />
                  <span className="truncate">{name}</span>
                  <Count count={count} waiting={waiting} />
                </Link>
                {groupMenu(id)}
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className={HEADING}>
        <p id="sidebar-projects" className={TITLE}>
          Projets
        </p>
        <button type="button" aria-label="Ajouter un projet" className={PLUS} onClick={onBrowse}>
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      <nav aria-labelledby="sidebar-projects" className="mt-1">
        <ul className="flex flex-col gap-0.5">
          {projects.map(({ count, git, id, name, waiting }) => {
            const Icon = git ? FolderGit2 : Folder;
            return (
              <li key={id} className={ROW}>
                <Link
                  href={`/projects/${id}/sessions`}
                  aria-current={active.project === id ? 'page' : undefined}
                  className={LINK}
                >
                  <Icon aria-hidden className="size-4 shrink-0" />
                  <span className="truncate">{name}</span>
                  <Count count={count} waiting={waiting} />
                </Link>
                {projectMenu(id)}
              </li>
            );
          })}
          <li className={ROW}>
            <Link href="/projects" aria-current={active.projects ? 'page' : undefined} className={LINK}>
              <List aria-hidden className="size-4 shrink-0" />
              <span className="truncate">Tous les projets</span>
              <span className="ml-auto pr-1.5 font-mono text-xs">{allProjects}</span>
            </Link>
          </li>
          <li className={ROW}>
            {/* Ouvre « Tous les projets » sur sa section « Hors projet » */}
            <Link href="/projects#outside" className={LINK}>
              <FolderOpen aria-hidden className="size-4 shrink-0" />
              <span className="truncate">Hors projet</span>
              <Count count={outside.count} waiting={outside.waiting} />
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

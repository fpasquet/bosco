import { Download, Star } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { clockOf } from '../../lib/detail';

/** Un projet de la session : sa branche et ce qu'elle a changé ; null tant que ce n'est pas lu. */
export interface CardProject {
  branch: null | string;
  files: null | number;
  /** Branche de départ de sa copie, en bac à sable */
  from?: string;
  name: string;
  /** Dernière récupération de sa branche, en bac à sable */
  retrievedAt?: null | string;
  root: string;
}

export interface ProjectsCardProps {
  /** Une action ou un tour en cours : la copie s'écrit encore */
  busy?: boolean;
  /** Récupère la branche d'un projet (sa racine), ou toutes celles qui ont du travail (null) ; sur le poste : absent */
  onRetrieve?: (root: null | string) => void;
  /** Projets de la session, le principal d'abord */
  projects: CardProject[];
}

/** « 1 modifié », « 2 modifiés », « aucun changement » */
function changes(files: null | number): string {
  if (files === null) return '…';
  if (files === 0) return 'aucun changement';
  return files > 1 ? `${files} modifiés` : '1 modifié';
}

/**
 * Projets d'une session à plusieurs projets : le principal, marqué de l'étoile, où elle tourne, puis ceux qu'elle
 * voit, chacun avec sa branche et ses fichiers modifiés. En bac à sable, la carte devient « Branches » : chaque branche
 * se récupère seule, ou toutes celles qui ont du travail, les projets sans changement étant laissés.
 */
export function ProjectsCard({ busy = false, onRetrieve, projects }: ProjectsCardProps) {
  const sandboxed = Boolean(onRetrieve);
  const title = sandboxed ? 'Branches' : 'Projets';
  const withWork = projects.some(({ files }) => (files ?? 0) > 0);
  return (
    <section aria-labelledby="projects-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="projects-title" className="mb-1 text-xs font-semibold text-muted">
        {title} · {projects.length}
      </h2>
      <p className="mb-3 text-xs text-muted">
        {sandboxed ? 'Une copie par projet, sur la même branche' : 'Sur le poste'}
      </p>
      <ul className="flex flex-col divide-y divide-line">
        {projects.map((project, index) => (
          <li key={project.root} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
            <span className="flex items-center gap-1.5 text-sm">
              {index === 0 && <Star aria-hidden className="size-3.5 fill-current text-primary" />}
              <span className="min-w-0 truncate font-medium">{project.name}</span>
              {index === 0 && <span className="badge badge-ghost badge-xs">principal</span>}
              {onRetrieve && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="ml-auto"
                  aria-label={`Récupérer la branche de ${project.name}`}
                  disabled={busy || !project.files}
                  onClick={() => onRetrieve(project.root)}
                >
                  <Download aria-hidden className="size-3.5" />
                </Button>
              )}
            </span>
            <span className="flex flex-wrap gap-x-2 font-mono text-xs text-muted">
              <span>{project.branch ?? '—'}</span>
              {project.from && <span>depuis {project.from}</span>}
              <span>{changes(project.files)}</span>
              {project.retrievedAt && <span>récupérée à {clockOf(project.retrievedAt)}</span>}
            </span>
          </li>
        ))}
      </ul>
      {onRetrieve && (
        <Button size="sm" className="mt-3 w-full" disabled={busy || !withWork} onClick={() => onRetrieve(null)}>
          <Download aria-hidden className="size-4" />
          Récupérer les branches
        </Button>
      )}
    </section>
  );
}

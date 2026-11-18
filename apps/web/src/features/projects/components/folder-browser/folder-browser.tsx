'use client';
import { Folder, FolderGit2 } from 'lucide-react';
import type { FolderListingDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { FolderDialog } from '@/shared/components/folder-dialog';
import { Button } from '@/shared/ui/button';
import { addLabel, checkedLabel, checkGitLabel, type ChosenFolder, gitToCheck } from '../../lib/selection';

export interface FolderBrowserProps {
  busy: boolean;
  chosen: readonly ChosenFolder[];
  error: null | string;
  /** Groupe où ranger les nouveaux projets ; null : « Aucun groupe » */
  group: null | number;
  groups: readonly { id: number; name: string }[];
  /** Dossier ouvert ; null pendant sa lecture */
  listing: FolderListingDto | null;
  onCancel: () => void;
  onCheck: (folders: ChosenFolder[]) => void;
  onGroupChange: (group: null | number) => void;
  onOpen: (path: string) => void;
  onSubmit: () => void;
  onToggle: (folder: ChosenFolder) => void;
  open: boolean;
}

/**
 * Ajouter des projets : le navigateur parcourt les dossiers du poste depuis le dossier personnel, sans saisir de
 * chemin. Seuls des noms de dossiers se voient ; la sélection est gardée d'un dossier à l'autre.
 */
export function FolderBrowser({
  busy,
  chosen,
  error,
  group,
  groups,
  listing,
  onCancel,
  onCheck,
  onGroupChange,
  onOpen,
  onSubmit,
  onToggle,
  open,
}: FolderBrowserProps) {
  const checked = new Set(chosen.map(({ path }) => path));
  const toCheck = listing ? gitToCheck(listing, chosen) : [];
  const withoutGit = chosen.filter(({ git }) => !git);
  return (
    <FolderDialog
      title="Ajouter des projets"
      open={open}
      listing={listing}
      onCancel={onCancel}
      onOpen={onOpen}
      dimmed={(folder) => folder.added}
      above={
        toCheck.length > 0 && (
          <p className="px-5 text-sm">
            <button type="button" className="link font-medium link-primary link-hover" onClick={() => onCheck(toCheck)}>
              {checkGitLabel(toCheck.length)}
            </button>
          </p>
        )
      }
      renderFolder={(folder) => {
        const Icon = folder.git ? FolderGit2 : Folder;
        return (
          <>
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              aria-label={folder.name}
              checked={folder.added || checked.has(folder.path)}
              disabled={folder.added || busy}
              onChange={() => onToggle({ git: folder.git, name: folder.name, path: folder.path })}
            />
            <Icon aria-hidden className="size-4 shrink-0 text-muted" />
            <span
              className={cn('min-w-0 flex-1 truncate font-mono text-sm', folder.added ? 'text-muted' : 'font-medium')}
            >
              {folder.name}
            </span>
            {folder.git ? (
              <span className="badge badge-ghost badge-sm">git</span>
            ) : (
              <span className="badge badge-outline badge-sm whitespace-nowrap">sans git</span>
            )}
            {folder.added && <span className="badge badge-ghost badge-sm whitespace-nowrap">déjà ajouté</span>}
            {folder.suggestion && !folder.added && (
              <span className="badge badge-soft badge-sm whitespace-nowrap badge-info">suggestion</span>
            )}
          </>
        );
      }}
      below={
        <>
          {withoutGit.length > 0 && (
            <p className="px-5 text-xs text-muted">
              Sans git, pas de bac à sable : {withoutGit.map(({ name }) => name).join(', ')} tournera seulement sur le
              poste.
            </p>
          )}
          {error && (
            <p role="alert" className="mx-5 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </>
      }
      footer={
        <>
          <label className="flex items-center gap-2">
            <span className="text-muted">Dans le groupe :</span>
            <select
              className="select w-56"
              value={group ?? ''}
              onChange={(event) => onGroupChange(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Aucun groupe</option>
              {groups.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-muted">{checkedLabel(chosen.length)}</span>
          <Button variant="ghost" className="text-muted" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" disabled={chosen.length === 0 || busy} onClick={onSubmit}>
            {addLabel(chosen.length)}
          </Button>
        </>
      }
    />
  );
}

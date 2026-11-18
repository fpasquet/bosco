'use client';
import { Folder, FolderCog } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FolderListingDto } from '@bosco/domain';
import { FolderDialog } from '@/shared/components/folder-dialog';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';

export interface AddFolderDialogProps {
  busy: boolean;
  /** Dossier ouvert, dossiers cachés compris ; null pendant sa lecture */
  listing: FolderListingDto | null;
  onCancel: () => void;
  onOpen: (path: string) => void;
  onSubmit: (path: string) => void;
  open: boolean;
  /** Refus de l'API (« Ce dossier n’est pas un dossier de configuration de Claude Code. ») */
  serverError: null | string;
}

/** Les dossiers de configuration de Claude Code s'appellent d'ordinaire .claude, .claude-perso… */
const looksLikeProfile = (name: string) => name.startsWith('.claude');

/**
 * « Ajouter un dossier » : un autre dossier de configuration de Claude Code, surveillé comme un profil, choisi dans le
 * navigateur de dossiers du poste, dossiers cachés compris (« ~/.claude-perso »).
 */
export function AddFolderDialog({
  busy,
  listing,
  onCancel,
  onOpen,
  onSubmit,
  open,
  serverError,
}: AddFolderDialogProps) {
  const { control, register, reset } = useForm<{ path: string }>({ defaultValues: { path: '' } });
  const path = useWatch({ control, name: 'path' });
  useEffect(() => {
    if (open) reset({ path: '' });
  }, [open, reset]);
  const chosen = listing?.folders.find((folder) => folder.path === path);
  return (
    <FolderDialog
      title="Ajouter un dossier"
      open={open}
      listing={listing}
      onCancel={onCancel}
      onOpen={onOpen}
      above={
        <p className="px-5 text-xs text-muted">
          Un dossier de Claude Code, lancé avec CLAUDE_CONFIG_DIR : {APP_NAME} le lit comme un profil, sans rien y
          modifier. Les dossiers cachés sont montrés.
        </p>
      }
      renderFolder={(folder) => {
        const Icon = looksLikeProfile(folder.name) ? FolderCog : Folder;
        return (
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <input
              type="radio"
              className="radio radio-sm radio-primary"
              value={folder.path}
              disabled={busy}
              {...register('path')}
            />
            <Icon aria-hidden className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate font-mono text-sm">{folder.name}</span>
          </label>
        );
      }}
      below={
        serverError && (
          <p role="alert" className="mx-5 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )
      }
      footer={
        <>
          <span className="min-w-0 truncate font-mono text-sm text-muted">
            {chosen?.name ?? 'Aucun dossier choisi'}
          </span>
          <Button variant="ghost" className="ml-auto text-muted" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" disabled={!chosen || busy} onClick={() => chosen && onSubmit(chosen.path)}>
            Ajouter
          </Button>
        </>
      }
    />
  );
}

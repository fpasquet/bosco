'use client';
import { FileKey, Folder } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FolderListingDto } from '@bosco/domain';
import { FolderDialog } from '@/shared/components/folder-dialog';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';

export interface TokenFileDialogProps {
  busy: boolean;
  /** Dossier ouvert, dossiers et fichiers cachés compris ; null pendant sa lecture */
  listing: FolderListingDto | null;
  onCancel: () => void;
  onOpen: (path: string) => void;
  onSubmit: (path: string) => void;
  open: boolean;
  /** Refus de l'API (« Le fichier du jeton est vide. ») */
  serverError: null | string;
}

/**
 * « Utiliser un jeton longue durée » : le fichier où la personne a rangé le jeton de `claude setup-token`, choisi dans le
 * navigateur du poste, fichiers cachés compris. Bosco n'en garde que le chemin et vérifie seulement qu'il se lit.
 */
export function TokenFileDialog({
  busy,
  listing,
  onCancel,
  onOpen,
  onSubmit,
  open,
  serverError,
}: TokenFileDialogProps) {
  const { control, register, reset } = useForm<{ path: string }>({ defaultValues: { path: '' } });
  const path = useWatch({ control, name: 'path' });
  useEffect(() => {
    if (open) reset({ path: '' });
  }, [open, reset]);
  const chosen = listing?.files?.find((file) => file.path === path);
  return (
    <FolderDialog
      title="Utiliser un jeton longue durée"
      open={open}
      listing={listing}
      onCancel={onCancel}
      onOpen={onOpen}
      above={
        <p className="px-5 text-xs text-muted">
          Choisis le fichier où tu as rangé le jeton créé par <code>claude setup-token</code>. {APP_NAME} n’en garde que
          le chemin, jamais le jeton, et le passe à Claude Code au lancement de chaque tour. Les fichiers cachés sont
          montrés.
        </p>
      }
      renderFolder={(folder) => (
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Folder aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{folder.name}</span>
        </span>
      )}
      renderFile={(file) => (
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            type="radio"
            className="radio radio-sm radio-primary"
            value={file.path}
            disabled={busy}
            {...register('path')}
          />
          <FileKey aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{file.name}</span>
        </label>
      )}
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
            {chosen?.name ?? 'Aucun fichier choisi'}
          </span>
          <Button variant="ghost" className="ml-auto text-muted" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="primary" disabled={!chosen || busy} onClick={() => chosen && onSubmit(chosen.path)}>
            Utiliser ce fichier
          </Button>
        </>
      }
    />
  );
}

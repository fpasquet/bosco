'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';

const folderSchema = z.object({
  path: z.string().refine((value) => value.trim().length > 0, 'Indique le dossier à surveiller.'),
});

type FolderValues = z.infer<typeof folderSchema>;

export interface AddFolderDialogProps {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (path: string) => void;
  open: boolean;
  /** Refus de l'API, posé sous le champ (« Ce dossier n’est pas un dossier de configuration de Claude Code. ») */
  serverError: null | string;
}

/** « Ajouter un dossier » : un autre dossier de configuration de Claude Code, surveillé comme un profil. */
export function AddFolderDialog({ busy, onCancel, onSubmit, open, serverError }: AddFolderDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { error: useId(), hint: useId(), title: useId() };
  const { formState, handleSubmit, register, reset, setError } = useForm<FolderValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { path: '' },
  });
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      reset({ path: '' });
      element.showModal();
    }
    if (!open && element?.open) element.close();
  }, [open, reset]);
  useEffect(() => {
    if (serverError) setError('path', { type: 'server', message: serverError });
  }, [serverError, setError]);
  const error = formState.errors.path?.message;
  return (
    <dialog ref={dialog} className="modal" aria-labelledby={ids.title} onClose={onCancel}>
      <form
        noValidate
        className="modal-box flex max-w-lg flex-col gap-4"
        onSubmit={(event) => void handleSubmit(({ path }) => onSubmit(path.trim()))(event)}
      >
        <div className="flex items-center">
          <h2 id={ids.title} className="font-display text-lg font-semibold">
            Ajouter un dossier
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted"
            aria-label="Fermer"
            onClick={onCancel}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Dossier de configuration</span>
          <input
            className="input w-full font-mono"
            placeholder="~/.claude-pro"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${ids.hint} ${ids.error}` : ids.hint}
            {...register('path')}
          />
          <span id={ids.hint} className="text-xs text-muted">
            Un dossier de Claude Code, lancé avec CLAUDE_CONFIG_DIR : {APP_NAME} le lit comme un profil, sans rien y
            modifier.
          </span>
          {error && (
            <span id={ids.error} className="text-xs text-danger">
              {error}
            </span>
          )}
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            Ajouter
          </Button>
        </div>
      </form>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

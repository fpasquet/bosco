'use client';
import { HardDrive, Radio, Trash2, TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { DataDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import { count, isResetWord, names } from '../../lib/format';

export interface ResetDialogProps {
  busy: boolean;
  onCancel: () => void;
  onConfirm: (word: string) => void;
  open: boolean;
  /** Ce que la réinitialisation effacerait, retirerait des profils et perdrait */
  reset: DataDto['reset'];
}

/** « 3 sources, 15 projets et 4 groupes, 214 sessions et leur usage, … sont effacés » */
function erasedLine({ groups, projects, sessions, sources }: DataDto['reset']): string {
  const catalog = names([count(sources, 'source'), count(projects, 'projet'), count(groups, 'groupe')]);
  return `${catalog}, ${count(sessions, 'session')} et leur usage, le contexte, les téléphones appairés et les réglages sont effacés`;
}

function BranchesWarning({ branches }: { branches: readonly string[] }) {
  if (branches.length === 0) return null;
  const many = branches.length > 1;
  return (
    <li className="flex gap-2 rounded-card bg-warning-soft px-3 py-2">
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
      <span>
        <b className="block font-medium">
          {many
            ? `${branches.length} bacs à sable ont une branche pas encore récupérée : `
            : '1 bac à sable a une branche pas encore récupérée : '}
          <span className="font-mono">{branches.join(', ')}</span>
        </b>
        <span className="block text-xs">
          {many
            ? 'Elles seront perdues. Récupère-les depuis leur session avant de réinitialiser.'
            : 'Elle sera perdue. Récupère-la depuis sa session avant de réinitialiser.'}
        </span>
      </span>
    </li>
  );
}

/**
 * Confirmation avant de tout effacer : elle chiffre ce qui part, nomme les profils nettoyés et les branches qui
 * seraient perdues, et demande d'écrire « RÉINITIALISER » (sans tenir compte des majuscules ni des accents).
 */
export function ResetDialog({ busy, onCancel, onConfirm, open, reset }: ResetDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { text: useId(), title: useId(), word: useId() };
  const { control, register, reset: clear } = useForm({ defaultValues: { word: '' } });
  const word = useWatch({ control, name: 'word' });
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      clear();
      element.showModal();
    }
    if (!open && element?.open) element.close();
  }, [clear, open]);
  const many = reset.profiles.length > 1;
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      role="alertdialog"
      aria-labelledby={ids.title}
      aria-describedby={ids.text}
      onClose={onCancel}
    >
      <form
        className="modal-box flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (isResetWord(word)) onConfirm(word);
        }}
      >
        <div>
          <h2 id={ids.title} className="font-display text-lg font-semibold">
            Réinitialiser {APP_NAME} ?
          </h2>
          <p id={ids.text} className="text-sm text-muted">
            {APP_NAME} efface tout ce qu’il a gardé et revient à son premier lancement.
          </p>
        </div>
        <ul className="flex flex-col gap-2.5 text-sm">
          <li className="flex gap-2">
            <Trash2 aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <b className="font-medium">{erasedLine(reset)}</b>
          </li>
          {reset.profiles.length > 0 && (
            <li className="flex gap-2">
              <Radio aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span>
                <b className="block font-medium">
                  Le suivi en direct, le canal et le serveur de {APP_NAME} sont retirés{' '}
                  {many ? 'des profils' : 'du profil'} {names(reset.profiles)}
                </b>
                <span className="block text-xs text-muted">
                  {many ? 'Leurs réglages' : 'Ses réglages'} d’avant l’installation sont remis.
                </span>
              </span>
            </li>
          )}
          <BranchesWarning branches={reset.branches} />
          <li className="flex gap-2">
            <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <b className="font-medium">Les dossiers et les sessions de Claude Code ne sont jamais touchés</b>
          </li>
        </ul>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ids.word} className="text-sm font-medium">
            Écris <span className="font-mono">RÉINITIALISER</span> pour confirmer
          </label>
          <input id={ids.word} className="input w-full font-mono" autoComplete="off" {...register('word')} />
        </div>
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="destructive" disabled={busy || !isResetWord(word)}>
            Tout effacer
          </Button>
        </div>
      </form>
    </dialog>
  );
}

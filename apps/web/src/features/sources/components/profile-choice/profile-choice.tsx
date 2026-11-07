'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, History, Radar, SquareTerminal } from 'lucide-react';
import { useState } from 'react';
import type { ProfileCandidateDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import { sourcesQuery, watchProfiles } from '../../api/sources';
import { displayPath, repositories, sinceNow } from '../../lib/format';

interface ProfileChoiceProps {
  candidates: ProfileCandidateDto[];
  home: string;
}

/**
 * Choix des profils au premier lancement : tous cochés d'office ; rien n'est lu avant « Surveiller ces profils »,
 * l'aperçu ne vient que des noms et dates des fichiers (CA-SESS-01, CA-SESS-02).
 */
export function ProfileChoice({ candidates, home }: ProfileChoiceProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(() => new Set(candidates.map((candidate) => candidate.path)));
  const watch = useMutation({
    mutationFn: () => watchProfiles([...selected]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey }),
  });
  const now = new Date();
  const toggle = (path: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  const count = candidates.length;

  return (
    <section aria-labelledby="profiles-title" className="w-full rounded-card border border-line bg-surface shadow-card">
      <div className="px-6 pt-6">
        <span className="grid size-10 place-items-center rounded-control bg-primary-soft text-primary">
          <Radar aria-hidden className="size-5" />
        </span>
        <h2 id="profiles-title" className="mt-3 font-display text-lg font-semibold">
          {APP_NAME} a trouvé {count} {count > 1 ? 'profils' : 'profil'} Claude Code sur ce poste
        </h2>
        <p className="mt-1 text-muted">
          Choisis ceux à surveiller. Tu pourras en ajouter ou en retirer à tout moment dans les sources.
        </p>
      </div>
      <ul className="mx-6 mt-4 divide-y divide-line rounded-card border border-line">
        {candidates.map((candidate) => {
          const path = displayPath(candidate.path, home);
          const last = candidate.lastSessionAt
            ? ` · dernière session ${sinceNow(new Date(candidate.lastSessionAt), now)}`
            : '';
          return (
            <li key={candidate.path}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={selected.has(candidate.path)}
                  onChange={() => toggle(candidate.path)}
                />
                <span className="grid size-7 shrink-0 place-items-center rounded-control bg-surface-alt text-muted">
                  <SquareTerminal aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono font-medium break-all">{path}</span>
                  <span className="block text-xs text-muted">
                    {repositories(candidate.repositoryCount)}
                    {last}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="flex items-center gap-2 px-6 pt-4 text-xs text-muted">
        <History aria-hidden className="size-3.5 shrink-0" />
        Les sessions des 30 derniers jours sont importées dans l’historique.
      </p>
      <div className="flex items-center gap-3 px-6 pt-4 pb-6">
        <Button disabled={watch.isPending} onClick={() => watch.mutate()}>
          <Check aria-hidden className="size-4" />
          Surveiller ces profils
        </Button>
        {watch.isError ? (
          <p role="alert" className="text-sm text-danger">
            Les profils n’ont pas pu être enregistrés. Réessaie.
          </p>
        ) : null}
      </div>
    </section>
  );
}

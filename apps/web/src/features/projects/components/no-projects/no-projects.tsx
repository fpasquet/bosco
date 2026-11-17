'use client';
import { FolderPlus, Monitor } from 'lucide-react';
import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FolderSuggestionDto } from '@bosco/domain';
import { displayPath } from '@/lib/format';
import { Button } from '@/shared/ui/button';
import { addLabel, checkedLabel, sessionsLabel } from '../../lib/selection';

export interface NoProjectsProps {
  busy: boolean;
  home: string;
  onAdd: (paths: string[]) => void;
  onBrowse: () => void;
  suggestions: FolderSuggestionDto[];
}

/**
 * Aucun projet encore : rien n'est rangé, toutes les sessions sont hors projet. Bosco propose les dossiers où des
 * sessions ont tourné, les dépôts git récents cochés d'office ; sur le téléphone, la liste se lit sans case.
 */
export function NoProjects({ busy, home, onAdd, onBrowse, suggestions }: NoProjectsProps) {
  const titleId = useId();
  const { control, handleSubmit, register } = useForm<{ paths: string[] }>({
    defaultValues: { paths: suggestions.filter(({ preselected }) => preselected).map(({ path }) => path) },
  });
  const paths = useWatch({ control, name: 'paths' });
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-8 text-center shadow-card">
        <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <FolderPlus aria-hidden className="size-6" />
        </span>
        <h2 className="font-display text-lg font-semibold">Aucun projet pour l’instant</h2>
        <p className="max-w-measure text-muted">Ajoute les dossiers où tu travailles : Bosco y rangera tes sessions.</p>
        <Button variant="primary" className="hidden md:inline-flex" onClick={onBrowse}>
          Ajouter des projets
        </Button>
        <p className="flex items-center gap-2 text-xs text-muted md:hidden">
          <Monitor aria-hidden className="size-4" />
          Ajouter des projets se fait depuis le poste.
        </p>
      </section>
      {suggestions.length > 0 && (
        <form
          aria-labelledby={titleId}
          className="rounded-card border border-line bg-surface shadow-card"
          onSubmit={(event) => void handleSubmit((values) => onAdd(values.paths))(event)}
        >
          <div className="border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h2 id={titleId} className="text-xs font-semibold text-muted">
                Suggestions
              </h2>
              <span className="badge badge-ghost font-mono badge-sm">{suggestions.length}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Dossiers où une session a tourné</p>
          </div>
          <ul aria-labelledby={titleId} className="divide-y divide-line">
            {suggestions.map((suggestion) => (
              <li key={suggestion.path}>
                <label className="flex items-center gap-3 px-4 py-2.5">
                  <input
                    type="checkbox"
                    className="checkbox hidden checkbox-sm checkbox-primary md:inline-grid"
                    value={suggestion.path}
                    disabled={busy}
                    {...register('paths')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {suggestion.name}
                      {!suggestion.git && <span className="badge badge-outline badge-sm">sans git</span>}
                    </span>
                    <span className="block truncate font-mono text-xs text-muted">
                      {displayPath(suggestion.path, home)}
                    </span>
                  </span>
                  <span className="text-xs whitespace-nowrap text-muted">{sessionsLabel(suggestion.sessions)}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-3 border-t border-line px-4 py-3 md:flex">
            <span className="ml-auto text-muted">{checkedLabel(paths.length)}</span>
            <Button type="submit" variant="primary" disabled={busy || paths.length === 0}>
              {addLabel(paths.length)}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

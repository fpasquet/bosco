'use client';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { LinkDto, LinkServiceDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const SERVICES: Record<LinkServiceDto, string> = {
  github: 'GitHub',
  jira: 'Jira',
  confluence: 'Confluence',
  decision: 'décision',
  page: 'page',
};

const TIME = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export interface TaskLinksProps {
  busy: boolean;
  error: null | string;
  links: LinkDto[];
  onAdd: (url: string) => void;
  onRemove: (link: LinkDto) => void;
  /** Adresse saisie : le service reconnu s'affiche avant l'ajout */
  onUrlChange: (url: string) => void;
  recognized: null | { kind: string; service: LinkServiceDto };
  taskId: number;
}

/**
 * Liens d'une tâche (E10b) : on colle une adresse, Bosco reconnaît le service et lit titre, état et auteur ; l'agent les
 * reçoit avec sa consigne, sans le contenu des pages ni les accès.
 */
export function TaskLinks({ busy, error, links, onAdd, onRemove, onUrlChange, recognized, taskId }: TaskLinksProps) {
  const { control, handleSubmit, register, reset } = useForm({ defaultValues: { url: '' } });
  const url = useWatch({ control, name: 'url' });
  const [removing, setRemoving] = useState<LinkDto | null>(null);
  return (
    <section
      aria-labelledby={`links-${taskId}`}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 id={`links-${taskId}`} className="text-xs font-semibold text-muted">
        Liens de T-{taskId}
      </h2>
      <form
        className="flex flex-col gap-1.5"
        onSubmit={(event) =>
          void handleSubmit(({ url: value }) => {
            onAdd(value.trim());
            reset();
          })(event)
        }
      >
        <label htmlFor={`link-url-${taskId}`} className="text-xs font-medium">
          Coller une adresse
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`link-url-${taskId}`}
            className="input flex-1 font-mono input-sm"
            placeholder="https://github.com/groupe/depot/pull/42"
            aria-invalid={error ? true : undefined}
            aria-describedby={`link-url-${taskId}-hint`}
            {...register('url', {
              required: true,
              onChange: (event: { target: { value: string } }) => onUrlChange(event.target.value),
            })}
          />
          <Button type="submit" size="sm" disabled={busy || !url.trim()} className="max-sm:btn-md">
            Ajouter
          </Button>
        </div>
        <p id={`link-url-${taskId}-hint`} className={error ? 'text-xs text-danger' : 'text-xs text-muted'}>
          {error ??
            (recognized && url.trim()
              ? `${recognized.kind} ${SERVICES[recognized.service]} reconnue`
              : 'GitHub, Jira, Confluence ou une décision ; toute autre adresse avec le titre de sa page.')}
        </p>
      </form>
      {links.length > 0 && (
        <ul aria-label="Liens de la tâche" className="divide-y divide-line">
          {links.map((link) => (
            <li key={link.id} className="flex items-start gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="font-medium text-ink">{SERVICES[link.service]}</span>
                  {link.state && <span className="badge badge-ghost badge-sm">{link.state}</span>}
                  {link.person && <span>{link.person}</span>}
                  {link.readAt && !link.error && <span>lu à {TIME.format(new Date(link.readAt))}</span>}
                </p>
                <a href={link.url} target="_blank" rel="noreferrer" className="block link truncate">
                  {link.title}
                </a>
                {link.error && (
                  <p className="text-xs text-warning">
                    Non rafraîchi : {link.error} ·{' '}
                    <Link href="/settings/integrations" className="link">
                      Voir les intégrations
                    </Link>
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Retirer le lien ${link.title}`}
                className="btn hidden btn-square btn-ghost btn-xs md:inline-flex"
                disabled={busy}
                onClick={() => setRemoving(link)}
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {removing && (
        <div
          role="alertdialog"
          aria-labelledby="link-remove-title"
          className="flex flex-wrap items-center gap-3 rounded-card bg-surface-alt p-3"
        >
          <p id="link-remove-title" className="min-w-0 flex-1 text-sm">
            Retirer « {removing.title} » de cette tâche seulement ?
          </p>
          <Button size="sm" variant="ghost" onClick={() => setRemoving(null)}>
            Annuler
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onRemove(removing);
              setRemoving(null);
            }}
          >
            Retirer
          </Button>
        </div>
      )}
      <p className="text-xs text-muted">
        Ces liens sont transmis à l’agent avec la consigne : titre, état et adresse. Le contenu des pages n’est pas
        transmis.
      </p>
    </section>
  );
}

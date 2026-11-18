'use client';
import { Layers, Plus, Star, X } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useId } from 'react';
import type { GroupDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import type { OptionProject } from '../../lib/new-session';

export interface ProjectsFieldProps {
  /** Projets de la session, le principal en tête */
  chosen: OptionProject[];
  /** Groupe choisi, dont les projets ont rempli le champ ; null sans groupe */
  group: null | { id: number; name: string };
  /** Ce que propose « + Projet » : les groupes d'abord, puis les projets pas encore choisis */
  offer: { groups: GroupDto[]; projects: OptionProject[] };
  onAdd: (root: string) => void;
  onChooseGroup: (group: GroupDto) => void;
  onDropGroup: () => void;
  onPrincipal: (root: string) => void;
  onRemove: (root: string) => void;
}

const ITEM = 'flex cursor-pointer items-center gap-2 px-3 py-2 outline-none focus:bg-surface-alt';
const LABEL = 'px-3 pt-2 pb-1 text-xs font-semibold text-muted';

/**
 * Champ « Projets » d'une nouvelle session : une puce par projet, le principal marqué de l'étoile et en
 * tête ; l'étoile d'un autre projet le rend principal, la croix le retire pour cette session seulement. « + Projet »
 * propose les groupes, qui remplissent le champ, puis les projets.
 */
export function ProjectsField({
  chosen,
  group,
  offer,
  onAdd,
  onChooseGroup,
  onDropGroup,
  onPrincipal,
  onRemove,
}: ProjectsFieldProps) {
  const labelId = useId();
  const empty = offer.groups.length === 0 && offer.projects.length === 0;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium">
        Projets
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-surface px-2 py-1.5"
      >
        {group && (
          <span className="badge gap-1.5 badge-soft badge-primary">
            <Layers aria-hidden className="size-3" />
            {group.name}
            <button
              type="button"
              className="inline-flex cursor-pointer"
              aria-label={`Retirer le groupe ${group.name}`}
              onClick={onDropGroup}
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        )}
        {chosen.map(({ name, root }, index) => {
          const principal = index === 0;
          return (
            <span key={root} className="badge gap-1 badge-outline">
              <button
                type="button"
                className="inline-flex cursor-pointer"
                aria-pressed={principal}
                aria-label={principal ? `${name}, projet principal` : `Faire de ${name} le projet principal`}
                onClick={() => onPrincipal(root)}
              >
                <Star aria-hidden className={cn('size-3', principal ? 'fill-current text-primary' : 'text-muted')} />
              </button>
              {name}
              {chosen.length > 1 && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer text-muted"
                  aria-label={`Retirer ${name}`}
                  onClick={() => onRemove(root)}
                >
                  <X aria-hidden className="size-3" />
                </button>
              )}
            </span>
          );
        })}
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild disabled={empty}>
            <button type="button" className="btn gap-1 btn-ghost font-normal text-muted btn-xs">
              <Plus aria-hidden className="size-3" />
              Projet
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={4}
              collisionPadding={8}
              className="z-50 max-h-96 max-w-xs min-w-56 overflow-y-auto rounded-card border border-line bg-surface text-sm text-ink shadow-overlay"
            >
              {offer.groups.length > 0 && (
                <DropdownMenu.Group>
                  <DropdownMenu.Label className={LABEL}>Groupes</DropdownMenu.Label>
                  {offer.groups.map((candidate) => (
                    <DropdownMenu.Item key={candidate.id} className={ITEM} onSelect={() => onChooseGroup(candidate)}>
                      <Layers aria-hidden className="size-4 text-muted" />
                      <span className="min-w-0 flex-1 truncate">{candidate.name}</span>
                      <span className="text-xs text-muted">{candidate.projects.length}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Group>
              )}
              {offer.projects.length > 0 && (
                <DropdownMenu.Group className={cn(offer.groups.length > 0 && 'border-t border-line')}>
                  <DropdownMenu.Label className={LABEL}>Projets</DropdownMenu.Label>
                  {offer.projects.map(({ name, root }) => (
                    <DropdownMenu.Item key={root} className={ITEM} onSelect={() => onAdd(root)}>
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Group>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

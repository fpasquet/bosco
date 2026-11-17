'use client';
import { ChevronRight, Ellipsis, Layers, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu } from 'radix-ui';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/shared/ui/button';
import { MENU_CONTENT, MENU_ITEM, MENU_SEPARATOR, SIDEBAR_TRIGGER } from './menu-styles';

export interface ProjectMenuProps {
  /** Ouvert d'emblée (histoires) */
  defaultOpen?: boolean;
  /** Groupes que le projet peut rejoindre : ni « Tous les projets », ni ceux qui le réunissent déjà */
  groups: { id: number; name: string }[];
  onAddToGroup: (group: { id: number; name: string }) => void;
  onNewGroup: () => void;
  onPin: (pinned: boolean) => void;
  onRemove: () => void;
  project: { id: number; name: string; pinned: boolean };
  /** Décisions proposées par un agent qui attendent la validation : leur nombre suit « Contexte » */
  proposals: number;
  /** Ligne de la barre latérale (bouton discret) ou en-tête de la page du projet (bouton contour) */
  variant?: 'header' | 'sidebar';
}

/**
 * Menu ⋯ d'un projet : ses onglets, une nouvelle session, ses groupes, sa place dans la barre latérale et son
 * retrait, qui demande une confirmation. Au clavier : Entrée ou Espace l'ouvre, Échap le ferme.
 */
export function ProjectMenu({
  defaultOpen,
  groups,
  onAddToGroup,
  onNewGroup,
  onPin,
  onRemove,
  project,
  proposals,
  variant = 'sidebar',
}: ProjectMenuProps) {
  const base = `/projects/${project.id}`;
  return (
    <DropdownMenu.Root modal={false} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger
        aria-label={variant === 'sidebar' ? `Actions de ${project.name}` : 'Actions du projet'}
        className={variant === 'sidebar' ? SIDEBAR_TRIGGER : buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <Ellipsis aria-hidden className="size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={variant === 'sidebar' ? 'start' : 'end'}
          side={variant === 'sidebar' ? 'right' : 'bottom'}
          sideOffset={4}
          collisionPadding={8}
          className={MENU_CONTENT}
        >
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`/sessions/new?project=${project.id}`}>
              <Plus aria-hidden className="size-4 text-muted" />
              Nouvelle session dans {project.name}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/sessions`}>Sessions</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/context`}>
              Contexte
              {proposals > 0 && (
                <span className="ml-auto badge badge-sm badge-primary">
                  {proposals}
                  <span className="sr-only"> à valider</span>
                </span>
              )}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/settings`}>Réglages</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={MENU_ITEM}>
              <Layers aria-hidden className="size-4 text-muted" />
              Ajouter à un groupe
              <ChevronRight aria-hidden className="ml-auto size-4 text-muted" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent sideOffset={4} collisionPadding={8} className={MENU_CONTENT}>
                {groups.map((group) => (
                  <DropdownMenu.Item key={group.id} className={MENU_ITEM} onSelect={() => onAddToGroup(group)}>
                    <Layers aria-hidden className="size-4 text-muted" />
                    {group.name}
                  </DropdownMenu.Item>
                ))}
                {groups.length > 0 && <DropdownMenu.Separator className={MENU_SEPARATOR} />}
                <DropdownMenu.Item className={MENU_ITEM} onSelect={onNewGroup}>
                  <Plus aria-hidden className="size-4 text-muted" />
                  Nouveau groupe…
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>
          <DropdownMenu.Item className={MENU_ITEM} onSelect={() => onPin(!project.pinned)}>
            {project.pinned ? (
              <PinOff aria-hidden className="size-4 text-muted" />
            ) : (
              <Pin aria-hidden className="size-4 text-muted" />
            )}
            {project.pinned ? 'Désépingler de la barre latérale' : 'Épingler dans la barre latérale'}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item className={cn(MENU_ITEM, 'text-danger')} onSelect={onRemove}>
            <Trash2 aria-hidden className="size-4" />
            Retirer le projet…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

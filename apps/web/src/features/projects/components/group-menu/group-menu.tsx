'use client';
import { Ellipsis, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu } from 'radix-ui';
import { cn } from '@/lib/cn';
import { buttonVariants } from '@/shared/ui/button';
import { MENU_CONTENT, MENU_ITEM, MENU_SEPARATOR, SIDEBAR_TRIGGER } from '../project-menu';

export interface GroupMenuProps {
  /** Ouvert d'emblée (histoires) */
  defaultOpen?: boolean;
  group: { id: number; name: string; sidebar: boolean };
  onDelete: () => void;
  onSidebar: (shown: boolean) => void;
  /** Ligne de la barre latérale (bouton discret) ou en-tête de la page du groupe (bouton contour) */
  variant?: 'header' | 'sidebar';
}

/**
 * Menu ⋯ d'un groupe : une session avec le groupe, ses onglets, sa place dans la barre latérale et sa
 * suppression, qui ne retire aucun projet.
 */
export function GroupMenu({ defaultOpen, group, onDelete, onSidebar, variant = 'sidebar' }: GroupMenuProps) {
  const base = `/groups/${group.id}`;
  return (
    <DropdownMenu.Root modal={false} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger
        aria-label={variant === 'sidebar' ? `Actions de ${group.name}` : 'Actions du groupe'}
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
            <Link href={`/sessions/new?group=${group.id}`}>
              <Plus aria-hidden className="size-4 text-muted" />
              Nouvelle session dans ce groupe
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/sessions`}>Sessions</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/instructions`}>Instructions</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={MENU_ITEM}>
            <Link href={`${base}/settings`}>Réglages</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item className={MENU_ITEM} onSelect={() => onSidebar(!group.sidebar)}>
            {group.sidebar ? (
              <EyeOff aria-hidden className="size-4 text-muted" />
            ) : (
              <Eye aria-hidden className="size-4 text-muted" />
            )}
            {group.sidebar ? 'Masquer de la barre latérale' : 'Afficher dans la barre latérale'}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={MENU_SEPARATOR} />
          <DropdownMenu.Item className={cn(MENU_ITEM, 'text-danger')} onSelect={onDelete}>
            <Trash2 aria-hidden className="size-4" />
            Supprimer le groupe…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

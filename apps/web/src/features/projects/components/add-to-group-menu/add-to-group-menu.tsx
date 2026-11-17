'use client';
import { ChevronDown, Layers, Plus } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import type { GroupDto } from '@bosco/domain';
import { cn } from '@/lib/cn';

export interface AddToGroupMenuProps {
  disabled?: boolean;
  /** Tous les groupes : ceux qui ne réunissent pas encore le projet sont proposés */
  groups: GroupDto[];
  onAdd: (group: GroupDto) => void;
  onNewGroup: () => void;
  project: { id: number; name: string };
}

const ITEM = 'flex cursor-pointer items-center gap-2 px-3 py-2 outline-none focus:bg-surface-alt';

/** « Ajouter à un groupe » d'un projet : les autres groupes, puis « Nouveau groupe… ». */
export function AddToGroupMenu({ disabled = false, groups, onAdd, onNewGroup, project }: AddToGroupMenuProps) {
  const others = groups.filter((group) => !group.system && !group.projects.some(({ id }) => id === project.id));
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button type="button" className="btn gap-1 btn-ghost font-normal text-muted btn-sm">
          Ajouter à un groupe
          <span className="sr-only"> : {project.name}</span>
          <ChevronDown aria-hidden className="size-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          collisionPadding={8}
          className="z-50 max-w-xs min-w-48 overflow-hidden rounded-card border border-line bg-surface text-sm text-ink shadow-overlay"
        >
          <DropdownMenu.Label className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
            Ajouter à un groupe
          </DropdownMenu.Label>
          {others.map((group) => (
            <DropdownMenu.Item key={group.id} className={ITEM} onSelect={() => onAdd(group)}>
              <Layers aria-hidden className="size-4 text-muted" />
              {group.name}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Item className={cn(ITEM, 'border-t border-line')} onSelect={onNewGroup}>
            <Plus aria-hidden className="size-4 text-muted" />
            Nouveau groupe…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

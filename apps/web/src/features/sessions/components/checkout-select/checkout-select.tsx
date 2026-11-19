'use client';
import { FolderGit2, GitBranch } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import type { CheckoutOption, CheckoutOptions } from '../../lib/checkouts';

export interface CheckoutSelectProps {
  /** Nom accessible, quand le champ n'a pas d'étiquette visible (une ligne du tableau des projets) */
  ariaLabel?: string;
  className?: string;
  /** Lié à l'aide sous le champ */
  describedBy?: string;
  disabled?: boolean;
  id?: string;
  onChange: (value: string) => void;
  options: CheckoutOptions;
  /** Ligne du tableau de plusieurs projets */
  size?: 'md' | 'sm';
  value: string;
}

function Badge({ text }: { text: string }) {
  return <span className="badge shrink-0 badge-soft font-sans badge-sm badge-primary">{text}</span>;
}

/** Nom d'une branche et son badge ; pour un worktree, son dossier dessous. */
function OptionText({ option }: { option: CheckoutOption }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate font-mono">{option.label}</span>
        {option.badge && <Badge text={option.badge} />}
      </span>
      {option.hint && <span className="truncate text-xs text-muted">{option.hint}</span>}
    </span>
  );
}

/**
 * Choix de la branche ou du worktree d'un projet : un bouton qui montre le choix, puis une liste à recherche, le
 * défaut en tête (la branche active, avec son badge), les worktrees et les branches rangés sous leur groupe, qui dit
 * leur type. La recherche lit le nom d'une branche et le dossier d'un worktree.
 */
export function CheckoutSelect({
  ariaLabel,
  className,
  describedBy,
  disabled = false,
  id,
  onChange,
  options,
  size = 'md',
  value,
}: CheckoutSelectProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const all = [options.default, ...options.worktrees, ...options.branches];
  const chosen = all.find((option) => option.value === value) ?? options.default;
  const worktree = options.worktrees.includes(chosen);
  const Icon = worktree ? FolderGit2 : GitBranch;
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };
  const item = (option: CheckoutOption) => (
    <CommandItem
      key={option.value}
      value={option.value}
      keywords={[option.label, option.hint ?? '', option.badge ?? '']}
      checked={option.value === chosen.value}
      onSelect={choose}
    >
      <OptionText option={option} />
    </CommandItem>
  );
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn('select w-full gap-2 text-left', size === 'sm' && 'select-sm', className)}
        >
          <Icon aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 truncate font-mono">{chosen.label}</span>
            {chosen.badge && <Badge text={chosen.badge} />}
          </span>
          {worktree && <span className="sr-only">, worktree</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={listId}
        aria-label="Branches et worktrees"
        align="start"
        className="popover-content-trigger p-0"
      >
        {/* Radix place le focus dans le calque à l'ouverture : sur la recherche, son premier champ */}
        <Command label="Rechercher une branche ou un worktree">
          <CommandInput placeholder="Rechercher…" />
          <CommandEmpty>Aucune branche ni aucun worktree à ce nom.</CommandEmpty>
          <CommandList>
            <CommandGroup>{item(options.default)}</CommandGroup>
            {options.worktrees.length > 0 && (
              <CommandGroup heading="Worktrees">{options.worktrees.map(item)}</CommandGroup>
            )}
            {options.branches.length > 0 && (
              <CommandGroup heading="Branches">{options.branches.map(item)}</CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

'use client';
import { FolderGit2, GitBranch } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
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

/** Une option : le nom de la branche, puis son badge (« active ») ou le dossier du worktree. */
function Option({ option }: { option: CheckoutOption }) {
  return (
    <SelectItem value={option.value}>
      <span className="truncate font-mono">{option.label}</span>
      {option.badge && <Badge text={option.badge} />}
      {option.hint && <span className="truncate text-xs text-muted">{option.hint}</span>}
    </SelectItem>
  );
}

/**
 * Choix de la branche ou du worktree d'un projet : le défaut en tête (la branche active, avec son badge), puis les
 * worktrees et les branches, rangés sous leur groupe qui dit leur type. Le bouton reprend le nom choisi et son badge.
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
  const all = [options.default, ...options.worktrees, ...options.branches];
  const chosen = all.find((option) => option.value === value) ?? options.default;
  const worktree = options.worktrees.includes(chosen);
  const Icon = worktree ? FolderGit2 : GitBranch;
  return (
    <Select value={chosen.value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} size={size} className={className} aria-label={ariaLabel} aria-describedby={describedBy}>
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2">
            <Icon aria-hidden className="size-4 shrink-0 text-muted" />
            <span className="truncate font-mono">{chosen.label}</span>
            {chosen.badge && <Badge text={chosen.badge} />}
            {worktree && <span className="sr-only">, worktree</span>}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Option option={options.default} />
        {options.worktrees.length > 0 && (
          <SelectGroup>
            <SelectLabel>Worktrees</SelectLabel>
            {options.worktrees.map((option) => (
              <Option key={option.value} option={option} />
            ))}
          </SelectGroup>
        )}
        {options.branches.length > 0 && (
          <SelectGroup>
            <SelectLabel>Branches</SelectLabel>
            {options.branches.map((option) => (
              <Option key={option.value} option={option} />
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

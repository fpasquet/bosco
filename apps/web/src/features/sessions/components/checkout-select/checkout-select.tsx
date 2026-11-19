'use client';
import type { CheckoutOptions } from '../../lib/checkouts';
import { DEFAULT_CHECKOUT } from '../../lib/checkouts';

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
  value: string;
}

/**
 * Choix de la branche ou du worktree d'un projet : le défaut en tête (la branche active), puis les worktrees et les
 * branches, chacun rangé sous son type et nommé avec lui (« feat/tarifs · worktree », « develop · branche »).
 */
export function CheckoutSelect({
  ariaLabel,
  className = 'select w-full font-mono',
  describedBy,
  disabled = false,
  id,
  onChange,
  options,
  value,
}: CheckoutSelectProps) {
  return (
    <select
      id={id}
      className={className}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value={DEFAULT_CHECKOUT}>{options.defaultLabel}</option>
      {options.worktrees.length > 0 && (
        <optgroup label="Worktrees">
          {options.worktrees.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      )}
      {options.branches.length > 0 && (
        <optgroup label="Branches">
          {options.branches.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

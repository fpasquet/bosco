'use client';
import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { cn } from '@/lib/cn';
import type { SettingOption } from './settings-options';

export interface SettingsMenuProps {
  /** Libellé accessible du bouton, qui reprend son texte visible (« Autorisations : Demander ») */
  ariaLabel: string;
  /** Puce compacte du téléphone plutôt que bouton discret de la barre d'outils */
  compact?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onChange: (value: string) => void;
  options: SettingOption[];
  /** D'où vient la valeur (« défaut du groupe »), écrite à côté du bouton */
  origin?: null | string;
  /** Accès complet : la puce passe en orange */
  risky?: boolean;
  /** Titre du menu ouvert */
  title: string;
  /** Texte du bouton : le choix courant */
  triggerLabel: string;
  value: string;
}

const TOOLBAR_CLASS = 'btn gap-1.5 btn-ghost font-normal text-muted btn-sm';
const CHIP_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-xs whitespace-nowrap focus-ring disabled:opacity-50';
const RISKY_TOOLBAR_CLASS = 'btn gap-1.5 btn-soft font-normal btn-sm btn-warning';
const RISKY_CHIP_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-warning bg-warning-soft px-2.5 text-xs whitespace-nowrap text-warning focus-ring disabled:opacity-50';

function triggerClass(compact: boolean, risky: boolean): string {
  if (risky) return compact ? RISKY_CHIP_CLASS : RISKY_TOOLBAR_CLASS;
  return compact ? CHIP_CLASS : TOOLBAR_CLASS;
}

/**
 * Un réglage du tour (autorisations, modèle, effort) : bouton à chevron et liste à choix unique, coché sur le choix
 * courant ; un choix grisé dit pourquoi. L'origine de la valeur s'écrit à côté du bouton.
 */
export function SettingsMenu({
  ariaLabel,
  compact = false,
  disabled = false,
  icon,
  onChange,
  options,
  origin = null,
  risky = false,
  title,
  triggerLabel,
  value,
}: SettingsMenuProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={origin ? `${ariaLabel}, ${origin}` : ariaLabel}
            className={triggerClass(compact, risky)}
          >
            {icon}
            {triggerLabel}
            <ChevronDown aria-hidden className="size-3" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            collisionPadding={8}
            className="z-50 max-w-xs min-w-48 overflow-hidden rounded-card border border-line bg-surface text-sm text-ink shadow-overlay"
          >
            <DropdownMenu.Label className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
              {title}
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={value} onValueChange={onChange} className="divide-y divide-line">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <DropdownMenu.RadioItem
                    key={option.value}
                    value={option.value}
                    disabled={Boolean(option.disabledReason)}
                    className="flex cursor-pointer items-start gap-2 px-3 py-2 outline-none focus:bg-surface-alt aria-checked:bg-primary-soft aria-disabled:cursor-not-allowed aria-disabled:text-muted"
                  >
                    <span className="mt-0.5 size-4 shrink-0">
                      <DropdownMenu.ItemIndicator>
                        <Check aria-hidden className="size-4 text-primary" />
                      </DropdownMenu.ItemIndicator>
                    </span>
                    {Icon && (
                      <Icon
                        aria-hidden
                        className={cn('mt-0.5 size-4 shrink-0', option.risky ? 'text-warning' : 'text-muted')}
                      />
                    )}
                    <span className="min-w-0">
                      <span className={cn('block font-medium', option.risky && 'text-warning')}>{option.label}</span>
                      {option.description && <span className="block text-xs text-muted">{option.description}</span>}
                      {option.disabledReason && (
                        <span className="block text-xs text-muted">{option.disabledReason}</span>
                      )}
                    </span>
                  </DropdownMenu.RadioItem>
                );
              })}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {origin && (
        <span aria-hidden className="text-xs whitespace-nowrap text-muted">
          {origin}
        </span>
      )}
    </span>
  );
}

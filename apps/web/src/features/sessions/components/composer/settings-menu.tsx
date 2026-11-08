'use client';
import type { ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
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
  /** Titre du menu ouvert */
  title: string;
  /** Texte du bouton : le choix courant */
  triggerLabel: string;
  value: string;
}

const TOOLBAR_CLASS = 'btn gap-1.5 btn-ghost font-normal text-muted btn-sm';
const CHIP_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-xs whitespace-nowrap focus-ring disabled:opacity-50';

/** Un réglage du tour (autorisations, modèle, effort) : bouton à chevron et liste à choix unique, coché sur le choix courant. */
export function SettingsMenu({
  ariaLabel,
  compact = false,
  disabled = false,
  icon,
  onChange,
  options,
  title,
  triggerLabel,
  value,
}: SettingsMenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button type="button" aria-label={ariaLabel} className={compact ? CHIP_CLASS : TOOLBAR_CLASS}>
          {icon}
          {triggerLabel}
          <ChevronDown aria-hidden className="size-3 text-muted" />
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
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-start gap-2 px-3 py-2 outline-none focus:bg-surface-alt aria-checked:bg-primary-soft"
              >
                <span className="mt-0.5 size-4 shrink-0">
                  <DropdownMenu.ItemIndicator>
                    <Check aria-hidden className="size-4 text-primary" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  {option.description && <span className="block text-xs text-muted">{option.description}</span>}
                </span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

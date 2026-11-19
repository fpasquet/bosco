'use client';
import type { PilotSettingsDto } from '@bosco/domain';
import { permissionModeOption } from '@/shared/lib/session-settings';
import { SettingsMenu } from './settings-menu';
import {
  DEFAULT_VALUE,
  effortLabel,
  effortOptions,
  modelLabel,
  modelOptions,
  modelValue,
  permissionLabel,
  permissionOptions,
  type SettingDefault,
  spokenLabel,
  withEffort,
  withModel,
  withPermissionMode,
} from './settings-options';

/**
 * Valeurs par défaut d'une nouvelle session : le modèle et l'effort qu'elle prend sans choix (« Défaut : Opus 5.5 »),
 * et d'où viennent les autorisations (« défaut du groupe »).
 */
export interface SettingsDefaults {
  effort?: SettingDefault;
  model?: SettingDefault;
  permissionMode?: null | string;
}

export interface SettingsBarProps {
  className?: string;
  /** Rangée de puces du téléphone */
  compact?: boolean;
  /** Nouvelle session : ses valeurs par défaut ; absent : « Défaut » sans valeur */
  defaults?: SettingsDefaults;
  disabled?: boolean;
  onChange: (settings: PilotSettingsDto) => void;
  /** Réglages choisis ; un modèle ou un effort null : celui par défaut */
  settings: PilotSettingsDto;
}

/**
 * Les trois réglages du tour : les cinq modes d'autorisations, chacun avec son icône (Accès complet en orange,
 * « Approuver pour moi » grisé quand le modèle ne le permet pas), le modèle et l'effort. Sans choix, le modèle et
 * l'effort cochent leur première option, « Défaut : Opus 5.5 », qui dit seule d'où vient la valeur.
 */
export function SettingsBar({
  className,
  compact = false,
  defaults = {},
  disabled = false,
  onChange,
  settings,
}: SettingsBarProps) {
  const permission = permissionLabel(settings);
  const mode = permissionModeOption(settings.permissionMode);
  const ModeIcon = mode.icon;
  const model = settings.model ?? defaults.model?.value ?? null;
  const modelText = modelLabel(settings, defaults.model);
  const effortText = effortLabel(settings, defaults.effort);
  return (
    <div className={className}>
      <SettingsMenu
        title="Autorisations"
        ariaLabel={`Autorisations : ${permission}`}
        icon={<ModeIcon aria-hidden className={compact ? 'size-3' : 'size-3.5'} />}
        triggerLabel={permission}
        options={permissionOptions(model)}
        value={settings.permissionMode}
        origin={defaults.permissionMode}
        risky={mode.risky}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withPermissionMode(settings, value))}
      />
      <SettingsMenu
        title="Modèle"
        ariaLabel={spokenLabel('Modèle', modelText, settings.model ? null : defaults.model?.origin)}
        triggerLabel={modelText}
        options={modelOptions(defaults.model)}
        value={modelValue(settings)}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withModel(settings, value))}
      />
      <SettingsMenu
        title="Effort"
        ariaLabel={spokenLabel('Effort', effortText, settings.effort ? null : defaults.effort?.origin)}
        triggerLabel={effortText}
        options={effortOptions(defaults.effort)}
        value={settings.effort ?? DEFAULT_VALUE}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withEffort(settings, value))}
      />
    </div>
  );
}

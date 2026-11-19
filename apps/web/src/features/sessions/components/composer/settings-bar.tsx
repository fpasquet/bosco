'use client';
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
  permissionMode,
  permissionOptions,
  type SettingDefault,
  spokenLabel,
  type ToolbarSettings,
  withEffort,
  withModel,
  withPermissionMode,
} from './settings-options';

/**
 * Valeurs par défaut d'une nouvelle session : les autorisations, le modèle et l'effort qu'elle prend sans choix
 * (« Défaut : Opus 5.5 »), chacun avec le niveau de Bosco qui le règle.
 */
export interface SettingsDefaults {
  effort?: SettingDefault;
  model?: SettingDefault;
  /** Absent : une session lancée, dont le mode est toujours choisi */
  permissionMode?: SettingDefault;
}

export interface SettingsBarProps {
  className?: string;
  /** Rangée de puces du téléphone */
  compact?: boolean;
  /** Nouvelle session : ses valeurs par défaut ; absent : « Défaut » sans valeur */
  defaults?: SettingsDefaults;
  disabled?: boolean;
  onChange: (settings: ToolbarSettings) => void;
  /** Réglages choisis ; null : la valeur par défaut */
  settings: ToolbarSettings;
}

/**
 * Les trois réglages du tour : les cinq modes d'autorisations, chacun avec son icône (Accès complet en orange,
 * « Approuver pour moi » grisé quand le modèle ne le permet pas), le modèle et l'effort. Sans choix, le modèle et
 * l'effort cochent leur première option, « Défaut : Opus 5.5 », qui dit seule d'où vient la valeur ; les autorisations
 * aussi, pour une nouvelle session.
 */
export function SettingsBar({
  className,
  compact = false,
  defaults = {},
  disabled = false,
  onChange,
  settings,
}: SettingsBarProps) {
  const permission = permissionLabel(settings, defaults.permissionMode);
  const mode = permissionModeOption(permissionMode(settings, defaults.permissionMode));
  const ModeIcon = mode.icon;
  const model = settings.model ?? defaults.model?.value ?? null;
  const modelText = modelLabel(settings, defaults.model);
  const effortText = effortLabel(settings, defaults.effort);
  return (
    <div className={className}>
      <SettingsMenu
        title="Autorisations"
        ariaLabel={spokenLabel(
          'Autorisations',
          permission,
          settings.permissionMode ? null : defaults.permissionMode?.origin,
        )}
        icon={<ModeIcon aria-hidden className={compact ? 'size-3' : 'size-3.5'} />}
        triggerLabel={permission}
        options={permissionOptions(model, defaults.permissionMode)}
        value={settings.permissionMode ?? DEFAULT_VALUE}
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

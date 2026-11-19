'use client';
import type { PilotSettingsDto } from '@bosco/domain';
import { permissionModeOption } from '@/shared/lib/session-settings';
import { SettingsMenu } from './settings-menu';
import {
  DEFAULT_VALUE,
  EFFORT_OPTIONS,
  effortLabel,
  MODEL_OPTIONS,
  modelLabel,
  modelValue,
  permissionLabel,
  permissionOptions,
  withEffort,
  withModel,
  withPermissionMode,
} from './settings-options';

/** D'où vient chaque réglage d'une nouvelle session (« défaut du groupe ») ; absent : rien à dire. */
export interface SettingsOrigins {
  effort?: null | string;
  model?: null | string;
  permissionMode?: null | string;
}

export interface SettingsBarProps {
  className?: string;
  /** Rangée de puces du téléphone */
  compact?: boolean;
  disabled?: boolean;
  onChange: (settings: PilotSettingsDto) => void;
  origins?: SettingsOrigins;
  settings: PilotSettingsDto;
}

/**
 * Les trois réglages du tour : les cinq modes d'autorisations, chacun avec son icône (Accès complet en orange,
 * « Approuver pour moi » grisé quand le modèle ne le permet pas), le modèle et l'effort ; chacun dit d'où il vient.
 */
export function SettingsBar({
  className,
  compact = false,
  disabled = false,
  onChange,
  origins = {},
  settings,
}: SettingsBarProps) {
  const permission = permissionLabel(settings);
  const model = modelLabel(settings);
  const mode = permissionModeOption(settings.permissionMode);
  const ModeIcon = mode.icon;
  return (
    <div className={className}>
      <SettingsMenu
        title="Autorisations"
        ariaLabel={`Autorisations : ${permission}`}
        icon={<ModeIcon aria-hidden className={compact ? 'size-3' : 'size-3.5'} />}
        triggerLabel={permission}
        options={permissionOptions(settings.model)}
        value={settings.permissionMode}
        origin={origins.permissionMode}
        risky={mode.risky}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withPermissionMode(settings, value))}
      />
      <SettingsMenu
        title="Modèle"
        ariaLabel={`Modèle : ${model}`}
        triggerLabel={model}
        options={MODEL_OPTIONS}
        value={modelValue(settings)}
        origin={origins.model}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withModel(settings, value))}
      />
      <SettingsMenu
        title="Effort"
        ariaLabel={effortLabel(settings)}
        triggerLabel={effortLabel(settings)}
        options={EFFORT_OPTIONS}
        value={settings.effort ?? DEFAULT_VALUE}
        origin={origins.effort}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withEffort(settings, value))}
      />
    </div>
  );
}

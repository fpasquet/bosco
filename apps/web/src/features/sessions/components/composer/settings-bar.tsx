'use client';
import { Shield } from 'lucide-react';
import type { PilotSettingsDto } from '@bosco/domain';
import { SettingsMenu } from './settings-menu';
import {
  DEFAULT_VALUE,
  EFFORT_OPTIONS,
  effortLabel,
  MODEL_OPTIONS,
  modelLabel,
  PERMISSION_OPTIONS,
  permissionLabel,
  withEffort,
  withModel,
  withPermissionMode,
} from './settings-options';

export interface SettingsBarProps {
  className?: string;
  /** Rangée de puces du téléphone */
  compact?: boolean;
  disabled?: boolean;
  onChange: (settings: PilotSettingsDto) => void;
  settings: PilotSettingsDto;
}

/** Les trois réglages du tour : autorisations, modèle et effort. */
export function SettingsBar({ className, compact = false, disabled = false, onChange, settings }: SettingsBarProps) {
  const permission = permissionLabel(settings);
  const model = modelLabel(settings);
  return (
    <div className={className}>
      <SettingsMenu
        title="Autorisations"
        ariaLabel={`Autorisations : ${permission}`}
        icon={<Shield aria-hidden className={compact ? 'size-3' : 'size-3.5'} />}
        triggerLabel={permission}
        options={PERMISSION_OPTIONS}
        value={settings.permissionMode}
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withPermissionMode(settings, value))}
      />
      <SettingsMenu
        title="Modèle"
        ariaLabel={`Modèle : ${model}`}
        triggerLabel={model}
        options={MODEL_OPTIONS}
        value={settings.model ?? DEFAULT_VALUE}
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
        compact={compact}
        disabled={disabled}
        onChange={(value) => onChange(withEffort(settings, value))}
      />
    </div>
  );
}

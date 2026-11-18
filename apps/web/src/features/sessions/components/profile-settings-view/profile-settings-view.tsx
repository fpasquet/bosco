'use client';
import { Folders, MessagesSquare, Monitor, SquareTerminal } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { SectionCard } from '@/shared/components/section-card';
import {
  EFFORT_CHOICES,
  effortName,
  MODEL_CHOICES,
  modelName,
  permissionModeOption,
} from '@/shared/lib/session-settings';
import { Button } from '@/shared/ui/button';
import { APP_NAME, type PermissionModeDto, type ProfileSettingsDto } from '@bosco/domain';
import { SettingsMenu } from '../composer/settings-menu';
import { DEFAULT_VALUE, permissionOptions } from '../composer/settings-options';

export interface ProfileSettingsViewProps {
  busy: boolean;
  onSave: (defaults: ProfileSettingsDto['defaults']) => void;
  /** Chemin du profil écrit comme dans le terminal (~/.claude) */
  path: string;
  settings: ProfileSettingsDto;
}

interface Values {
  effort: string;
  model: string;
  permissionMode: string;
}

const CLAUDE = 'Celui du profil Claude Code';

function valuesOf(defaults: ProfileSettingsDto['defaults']): Values {
  return {
    effort: defaults.effort ?? '',
    model: defaults.model ?? '',
    permissionMode: defaults.permissionMode ?? DEFAULT_VALUE,
  };
}

/** « Celui du profil Claude Code · Sonnet 5.5 », ou seul quand le profil ne dit rien. */
function claudeLabel(value: null | string): string {
  return value ? `${CLAUDE} · ${value}` : CLAUDE;
}

/** Une valeur lue sur le téléphone : la valeur, puis d'où elle vient. */
function ReadOnly({ label, origin, value }: { label: string; origin: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">
        <span className="block font-medium">{value}</span>
        <span className="block text-xs text-muted">{origin}</span>
      </dd>
    </div>
  );
}

/**
 * Réglages d'un profil (E4g) : son compte, et les valeurs par défaut des sessions lancées dans Bosco avec lui
 * (autorisations, modèle, effort), chacune avec son origine ; sans réglage, ce que dit le profil Claude Code, lu sans
 * être modifié. « Utilisé par » dit les groupes et les sessions ouvertes, que l'enregistrement ne change pas. Sur le
 * téléphone, tout se lit.
 */
export function ProfileSettingsView({ busy, onSave, path, settings }: ProfileSettingsViewProps) {
  const { claude, defaults, source } = settings;
  const { control, handleSubmit, register, reset, setValue, formState } = useForm<Values>({
    defaultValues: valuesOf(defaults),
  });
  useEffect(() => reset(valuesOf(defaults)), [defaults, reset]);
  const values = useWatch({ control });
  const model = values.model || claude.model;
  const chosenMode = values.permissionMode && values.permissionMode !== DEFAULT_VALUE ? values.permissionMode : null;
  const mode = permissionModeOption((chosenMode ?? claude.permissionMode ?? 'ask') as PermissionModeDto);
  const ModeIcon = mode.icon;
  const modeOptions = [
    { value: DEFAULT_VALUE, label: claudeLabel(permissionModeOption(claude.permissionMode ?? 'ask').label) },
    ...permissionOptions(model ?? null),
  ];
  const submit = handleSubmit((form) =>
    onSave({
      effort: (form.effort || null) as ProfileSettingsDto['defaults']['effort'],
      model: form.model || null,
      permissionMode: (form.permissionMode === DEFAULT_VALUE ? null : form.permissionMode) as PermissionModeDto | null,
    }),
  );
  const origin = (own: null | string) => (own ? 'Réglé pour ce profil' : CLAUDE);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <section className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-surface-alt text-muted">
          <SquareTerminal aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {source.label}
            {source.watched ? (
              <span className="badge badge-soft badge-sm badge-success">Actif</span>
            ) : (
              <span className="badge badge-ghost badge-sm">En pause</span>
            )}
            {settings.isDefault && <span className="badge badge-outline badge-sm">Profil par défaut</span>}
          </p>
          <p className="truncate font-mono text-xs text-muted">{path}</p>
        </div>
      </section>
      <SectionCard title="Abonnement">
        <p className="font-medium">{settings.account ?? 'Aucun accès à un abonnement Claude'}</p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {settings.isDefault
            ? `Profil par défaut de ${APP_NAME} : proposé à chaque nouvelle session.`
            : `Un autre profil est proposé par défaut à chaque nouvelle session.`}
          <Link href="/settings/subscription" className="link font-medium link-primary max-md:hidden">
            Changer<span className="sr-only"> le profil par défaut</span>
          </Link>
        </p>
      </SectionCard>
      <SectionCard title="Valeurs par défaut des sessions">
        <form className="hidden flex-col gap-4 md:flex" onSubmit={(event) => void submit(event)}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="w-44 shrink-0">
              <p className="font-medium">Autorisations</p>
              <p className="text-xs text-muted">{origin(chosenMode)}</p>
            </div>
            <SettingsMenu
              title="Autorisations"
              ariaLabel={`Autorisations par défaut : ${chosenMode ? mode.label : claudeLabel(mode.label)}`}
              icon={<ModeIcon aria-hidden className="size-3.5" />}
              triggerLabel={chosenMode ? mode.label : claudeLabel(mode.label)}
              options={modeOptions}
              value={values.permissionMode ?? DEFAULT_VALUE}
              risky={mode.risky}
              disabled={busy}
              onChange={(value) => setValue('permissionMode', value, { shouldDirty: true })}
            />
          </div>
          <label className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-44 shrink-0">
              <span className="block font-medium">Modèle</span>
              <span className="block text-xs text-muted">{origin(values.model || null)}</span>
            </span>
            <select className="select w-72" disabled={busy} {...register('model')}>
              <option value="">{claudeLabel(claude.model ? modelName(claude.model) : null)}</option>
              {MODEL_CHOICES.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-44 shrink-0">
              <span className="block font-medium">Effort</span>
              <span className="block text-xs text-muted">{origin(values.effort || null)}</span>
            </span>
            <select className="select w-72" disabled={busy} {...register('effort')}>
              <option value="">{claudeLabel(claude.effort ? effortName(claude.effort).toLowerCase() : null)}</option>
              {EFFORT_CHOICES.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted">
            Valent pour les sessions lancées dans {APP_NAME} avec ce profil. Un projet, un groupe ou la session peuvent
            en décider autrement.
          </p>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy || !formState.isDirty}>
              Enregistrer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!formState.isDirty}
              onClick={() => reset(valuesOf(defaults))}
            >
              Annuler
            </Button>
          </div>
        </form>
        <dl className="flex flex-col divide-y divide-line md:hidden">
          <ReadOnly
            label="Autorisations"
            value={permissionModeOption(defaults.permissionMode ?? claude.permissionMode ?? 'ask').label}
            origin={origin(defaults.permissionMode)}
          />
          <ReadOnly label="Modèle" value={modelName(defaults.model ?? claude.model)} origin={origin(defaults.model)} />
          <ReadOnly
            label="Effort"
            value={effortName(defaults.effort ?? claude.effort)}
            origin={origin(defaults.effort)}
          />
        </dl>
        <p className="flex items-center gap-2 text-xs text-muted md:hidden">
          <Monitor aria-hidden className="size-3.5 shrink-0" />
          Modifiable depuis le poste. Ces réglages sont réservés à toi.
        </p>
      </SectionCard>
      <SectionCard title="Utilisé par">
        <ul className="flex flex-col gap-2">
          {settings.usedBy.groups.map((group) => (
            <li key={group.id} className="flex items-start gap-2">
              <Folders aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span>
                <Link href={`/groups/${group.id}/settings`} className="link font-medium link-hover">
                  {group.name}
                </Link>
                <span className="block text-xs text-muted">Groupe · profil par défaut du groupe</span>
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <MessagesSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <span>
              {settings.usedBy.openSessions > 1
                ? `${settings.usedBy.openSessions} sessions ouvertes`
                : `${settings.usedBy.openSessions} session ouverte`}
              <span className="block text-xs text-muted">Non modifiées par ces réglages</span>
            </span>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}

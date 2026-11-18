'use client';
import { Download, ExternalLink, LoaderCircle, RefreshCw } from 'lucide-react';
import { useId } from 'react';
import type { AboutDto, UpdateChannelDto } from '@bosco/domain';
import { Markdown } from '@/shared/components/markdown';
import { SectionCard } from '@/shared/components/section-card';
import { Button } from '@/shared/ui/button';
import { Segmented } from '@/shared/ui/segmented';
import { APP_NAME } from '@bosco/domain';
import { downloadOf, INSTALL_LABELS, versionLabel } from '../../lib/version';

export interface AboutSettingsProps {
  about: AboutDto;
  /** Version de l'application Android, quand la page s'y affiche */
  androidApp: null | string;
  busy: boolean;
  /** Journal des versions embarqué ; null pendant son chargement */
  changelog: null | string;
  onCheck: () => void;
  onChoose: (choice: { channel: UpdateChannelDto; enabled: boolean }) => void;
  phone: boolean;
}

const CHANNELS = [
  { value: 'stable', label: 'Stable' },
  { value: 'beta', label: 'Bêta' },
] as const;

const DATE = new Intl.DateTimeFormat('fr', { dateStyle: 'long', timeStyle: 'short' });

function Line({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/** La version disponible : ses notes, le fichier à télécharger, la page de la release. */
function Available({ about, phone }: Pick<AboutSettingsProps, 'about' | 'phone'>) {
  const available = about.updates.available;
  if (!available) return null;
  const download = downloadOf(available, { install: about.install, phone });
  return (
    <SectionCard title={`Version ${available.version} disponible`}>
      <p id="disponible" className="text-sm text-muted">
        Publiée le {DATE.format(new Date(available.publishedAt))}.
        {about.install === 'appimage' &&
          ' Elle se télécharge toute seule : « Relancer pour mettre à jour » apparaît ensuite dans la barre système.'}
      </p>
      {available.notes && <Markdown className="text-sm">{available.notes}</Markdown>}
      <div className="flex flex-wrap gap-2">
        {download && (
          <Button asChild size="sm">
            <a href={download.url}>
              <Download aria-hidden className="size-4" />
              {download.label}
            </a>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <a href={available.url} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden className="size-4" />
            Voir sur GitHub
          </a>
        </Button>
      </div>
    </SectionCard>
  );
}

/**
 * Réglages › À propos : la version qui tourne, la recherche des mises à jour (canal, dernière recherche), la version
 * disponible et le journal des versions. Sur le téléphone, la recherche se lit sans se régler.
 */
export function AboutSettings({ about, androidApp, busy, changelog, onCheck, onChoose, phone }: AboutSettingsProps) {
  const helpId = useId();
  const { updates } = about;
  let checked = 'Jamais vérifiée';
  if (updates.checkedAt) checked = `Vérifiée le ${DATE.format(new Date(updates.checkedAt))}`;
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Version">
        <dl className="flex flex-col gap-2 text-sm">
          <Line label={APP_NAME}>
            <span className="font-mono">{versionLabel(about)}</span>
          </Line>
          <Line label="Installation">{INSTALL_LABELS[about.install]}</Line>
          {androidApp && (
            <Line label="Application Android">
              <span className="font-mono">{androidApp}</span>
            </Line>
          )}
        </dl>
      </SectionCard>
      <SectionCard title="Mises à jour">
        {!phone && (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <input
                type="checkbox"
                role="switch"
                aria-label="Chercher les nouvelles versions"
                className="toggle mt-0.5 toggle-primary"
                aria-describedby={helpId}
                checked={updates.enabled}
                disabled={busy}
                onChange={(event) => onChoose({ channel: updates.channel, enabled: event.target.checked })}
              />
              <span>
                <span className="block font-medium">Chercher les nouvelles versions</span>
                <span id={helpId} className="block text-xs text-muted">
                  Une fois par jour au plus, {APP_NAME} lit les releases publiées sur GitHub, sans aucun identifiant.
                </span>
              </span>
            </div>
            <Segmented
              label="Canal des mises à jour"
              value={updates.channel}
              options={CHANNELS}
              onChange={(channel) =>
                !busy && channel !== updates.channel && onChoose({ channel, enabled: updates.enabled })
              }
            />
          </div>
        )}
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">
            {checked}
            {phone && ` · canal ${updates.channel === 'beta' ? 'bêta' : 'stable'}`}
          </span>
          {!updates.available && updates.checkedAt && !updates.error && <span>· {APP_NAME} est à jour</span>}
          {!phone && (
            <Button size="xs" variant="ghost" className="text-primary" disabled={busy} onClick={onCheck}>
              {busy ? (
                <LoaderCircle aria-hidden className="size-3.5 animate-spin motion-reduce:animate-none" />
              ) : (
                <RefreshCw aria-hidden className="size-3.5" />
              )}
              Vérifier maintenant
            </Button>
          )}
        </p>
        {updates.error && (
          <p role="alert" className="text-sm text-warning">
            La dernière recherche a échoué : {updates.error}
          </p>
        )}
      </SectionCard>
      <Available about={about} phone={phone} />
      <SectionCard title="Nouveautés">
        <div id="nouveautes" className="text-sm">
          {changelog === null && <p className="text-muted">Chargement du journal des versions…</p>}
          {changelog === '' && (
            <p className="text-muted">Le journal des versions n’est pas fourni avec cette version.</p>
          )}
          {changelog && <Markdown>{changelog.replace(/^# .*\n/, '')}</Markdown>}
        </div>
      </SectionCard>
    </div>
  );
}

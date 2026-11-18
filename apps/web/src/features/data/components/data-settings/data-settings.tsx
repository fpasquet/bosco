'use client';
import { Database, History, LoaderCircle, RotateCcw } from 'lucide-react';
import type { DataDto, HistoryPeriodDto } from '@bosco/domain';
import { SectionCard } from '@/shared/components/section-card';
import { Button } from '@/shared/ui/button';
import { Segmented } from '@/shared/ui/segmented';
import { APP_NAME } from '@bosco/domain';
import { count, displayPath, fileSize, names, shortDate } from '../../lib/format';

export interface DataSettingsProps {
  busy: boolean;
  data: DataDto;
  onChooseHistory: (period: HistoryPeriodDto) => void;
  onReset: () => void;
  /** Sur le téléphone : lecture seule, sans choix de la période ni réinitialisation */
  readOnly?: boolean;
}

const PERIODS = [
  { value: '30-days', label: '30 derniers jours' },
  { value: 'all', label: 'Tout l’historique' },
] as const;

const PERIOD_LABELS: Record<HistoryPeriodDto, string> = { '30-days': '30 derniers jours', all: 'Tout l’historique' };

function Line({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/** Ce que « Tout l'historique » ajouterait : les sessions plus anciennes encore dans les profils surveillés. */
function olderLine({ profiles, sessions }: DataDto['history']['older']): string {
  const where = `${profiles.length > 1 ? 'les profils' : 'le profil'} ${names(profiles)}`;
  if (sessions === 1) return `1 session plus ancienne est encore dans ${where} : « Tout l’historique » l’ajoute.`;
  return `${sessions.toLocaleString('fr')} sessions plus anciennes sont encore dans ${where} : « Tout l’historique » les ajoute.`;
}

/** Historique importé : la période, ce que Bosco a déjà lu, et ce que « Tout l'historique » ajouterait. */
function HistoryCard({ busy, data, onChooseHistory, readOnly }: Omit<DataSettingsProps, 'onReset'>) {
  const { history } = data;
  const oldest = history.oldestSessionAt ? shortDate(history.oldestSessionAt) : null;
  if (readOnly)
    return (
      <SectionCard title="Historique importé">
        <dl className="flex flex-col gap-2 text-sm">
          <Line label="Période importée">{PERIOD_LABELS[history.period]}</Line>
          <Line label="Sessions importées">{history.sessions.toLocaleString('fr')}</Line>
          {oldest && <Line label="La plus ancienne">{oldest}</Line>}
        </dl>
      </SectionCard>
    );
  return (
    <SectionCard title="Historique importé">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium">Période importée</p>
          <p className="text-xs text-muted">
            Les sessions des profils surveillés que {APP_NAME} lit dans l’historique.
          </p>
        </div>
        <Segmented
          label="Période importée"
          value={history.period}
          options={PERIODS}
          onChange={(period) => !busy && period !== history.period && onChooseHistory(period)}
        />
      </div>
      <p className="flex items-center gap-2 text-sm">
        <History aria-hidden className="size-4 shrink-0 text-muted" />
        {count(history.sessions, 'session importée', 'sessions importées')}
        {oldest && ` · la plus ancienne du ${oldest}`}
      </p>
      {history.importing && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin motion-reduce:animate-none" />
          Lecture des sessions plus anciennes en cours…
        </p>
      )}
      {!history.importing && history.period === '30-days' && history.older.sessions > 0 && (
        <p className="text-xs text-muted">{olderLine(history.older)}</p>
      )}
    </SectionCard>
  );
}

/** Réinitialiser Bosco : ce qui est effacé, retiré des profils et arrêté, dit avant tout clic. */
function ResetCard({ onReset }: { onReset: () => void }) {
  return (
    <SectionCard title={`Réinitialiser ${APP_NAME}`}>
      <p className="text-sm">
        {APP_NAME} revient à son premier lancement. Les dossiers et les sessions de Claude Code ne sont jamais touchés.
      </p>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex flex-col md:flex-row md:gap-3">
          <dt className="font-medium md:w-36">Effacé</dt>
          <dd className="text-muted">
            Sources, projets et groupes, historique et usage, sessions pilotées, contexte, téléphones appairés, réglages
          </dd>
        </div>
        <div className="flex flex-col md:flex-row md:gap-3">
          <dt className="font-medium md:w-36">Retiré des profils</dt>
          <dd className="text-muted">
            Suivi en direct, canal et serveur de {APP_NAME}, avec leurs réglages d’avant remis
          </dd>
        </div>
        <div className="flex flex-col md:flex-row md:gap-3">
          <dt className="font-medium md:w-36">Arrêté</dt>
          <dd className="text-muted">Bacs à sable, leurs copies supprimées avec les branches non récupérées</dd>
        </div>
      </dl>
      <Button variant="outline" size="sm" className="w-fit text-danger" onClick={onReset}>
        <RotateCcw aria-hidden className="size-4" />
        Réinitialiser {APP_NAME}…
      </Button>
    </SectionCard>
  );
}

/**
 * Réglages › Données : la période importée depuis les profils, la base de Bosco et sa réinitialisation. Sur le
 * téléphone, la période, les sessions et la base se lisent seulement.
 */
export function DataSettings({ busy, data, onChooseHistory, onReset, readOnly = false }: DataSettingsProps) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {!readOnly && <p className="text-sm text-muted">Ce que {APP_NAME} garde de tes sessions, et où.</p>}
      <HistoryCard busy={busy} data={data} onChooseHistory={onChooseHistory} readOnly={readOnly} />
      <SectionCard title={`Base de ${APP_NAME}`}>
        <div className="flex items-center gap-3">
          <Database aria-hidden className="size-4 shrink-0 text-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm">{displayPath(data.database.dataDir, data.home)}</p>
            {!readOnly && (
              <p className="text-xs text-muted">
                Sessions lues, projets, groupes, contexte, réglages et copies des bacs à sable.
              </p>
            )}
          </div>
          <p className="shrink-0 font-mono text-sm">{fileSize(data.database.bytes)}</p>
        </div>
      </SectionCard>
      {readOnly ? (
        <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted">
          Modifiable depuis le poste. La réinitialisation de {APP_NAME} aussi.
        </p>
      ) : (
        <ResetCard onReset={onReset} />
      )}
    </div>
  );
}

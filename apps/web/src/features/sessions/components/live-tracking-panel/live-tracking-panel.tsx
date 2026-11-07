'use client';
import { Check, CircleDashed, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import type { LiveTrackingDto } from '../../api/live-tracking';
import { sinceNow } from '../../lib/format';

export type LiveTrackingStep = 'check' | 'install' | 'intro';

const STEPS: { label: string; value: LiveTrackingStep }[] = [
  { label: 'Présentation', value: 'intro' },
  { label: 'Installation', value: 'install' },
  { label: 'Vérification', value: 'check' },
];

/** Les six événements que suit Bosco (CA-SESS-62). */
const EVENTS = [
  'démarrage et fin de session',
  'ton message',
  'action de l’agent',
  'demande d’autorisation',
  'fin de tour',
];

export interface LiveTrackingPanelProps {
  busy: boolean;
  now: Date;
  onClose: () => void;
  onInstall: (backup: boolean) => void;
  onStepChange: (step: LiveTrackingStep) => void;
  onUninstall: () => void;
  /** Source dont on installe le suivi ; null : panneau fermé */
  source: null | { label: string; path: string };
  status: LiveTrackingDto | undefined;
  step: LiveTrackingStep;
}

function CheckLine({ detail, done, label }: { detail: string; done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3">
      {done ? (
        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
      ) : (
        <CircleDashed
          aria-hidden
          className="mt-0.5 size-4 shrink-0 animate-spin text-muted motion-reduce:animate-none"
        />
      )}
      <span className="min-w-0">
        <span className="block font-medium">
          {label}
          <span className="sr-only">{done ? ' : fait' : ' : en attente'}</span>
        </span>
        <span className="block text-xs text-muted">{detail}</span>
      </span>
    </li>
  );
}

/**
 * Panneau d'installation du suivi en direct d'un profil (E4b) : présentation, installation, vérification sur un vrai
 * signal. Rien n'est installé sans clic, et « Désinstaller » remet les réglages d'avant.
 */
export function LiveTrackingPanel(props: LiveTrackingPanelProps) {
  const { busy, now, onClose, onInstall, onStepChange, onUninstall, source, status, step } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const [backup, setBackup] = useState(true);
  useEffect(() => {
    const element = dialog.current;
    if (source && element && !element.open) element.showModal();
    if (!source && element?.open) element.close();
  }, [source]);
  const signal = status?.lastSignalAt ? new Date(status.lastSignalAt) : null;
  const index = STEPS.findIndex((candidate) => candidate.value === step);
  return (
    <dialog ref={dialog} className="modal modal-end" aria-labelledby="live-tracking-title" onClose={onClose}>
      <div className="modal-box flex size-full max-h-none max-w-md flex-col gap-5 rounded-none">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="live-tracking-title" className="font-display text-lg font-semibold">
              Suivi en direct · {source?.label}
            </h2>
            <p className="font-mono text-xs text-muted">{source?.path}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Fermer" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </Button>
        </header>
        <ol className="steps w-full text-xs">
          {STEPS.map((candidate, position) => (
            <li
              key={candidate.value}
              aria-current={candidate.value === step ? 'step' : undefined}
              className={cn('step', position <= index && 'step-primary')}
            >
              {candidate.label}
            </li>
          ))}
        </ol>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === 'intro' && (
            <div className="flex flex-col gap-3">
              <p>
                Avec le suivi en direct, {APP_NAME} sait aussitôt qu’une session t’attend : une commande à autoriser, ou
                un tour terminé.
              </p>
              <ul className="list-disc pl-5 text-muted">
                <li>
                  « Autoriser » et « Refuser » depuis {APP_NAME}, ou dans le terminal : la première réponse l’emporte.
                </li>
                <li>Les sessions en attente en tête de la vue d’ensemble.</li>
                <li>Si {APP_NAME} est arrêté, Claude Code continue normalement.</li>
              </ul>
            </div>
          )}
          {step === 'install' && (
            <div className="flex flex-col gap-4">
              <p>
                {APP_NAME} ajoute ses réglages au profil {source?.label}, sans rien remplacer. Il suit 6 événements :
              </p>
              <ul className="list-disc pl-5 text-muted">
                {EVENTS.map((event) => (
                  <li key={event}>{event}</li>
                ))}
              </ul>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={backup}
                  onChange={(event) => setBackup(event.target.checked)}
                />
                Garder une copie des réglages actuels
              </label>
              {status?.installed && <p className="text-success">Installé dans {status.settingsPath}</p>}
            </div>
          )}
          {step === 'check' && (
            <div className="flex flex-col gap-4">
              {status?.installed && signal && (
                <p className="font-medium text-success">Le suivi en direct fonctionne pour {source?.label}</p>
              )}
              <ul className="flex flex-col gap-3">
                <CheckLine
                  label="Réglages écrits"
                  detail={status?.settingsPath ?? '…'}
                  done={Boolean(status?.installed)}
                />
                <CheckLine label={`${APP_NAME} joignable`} detail="port local" done />
                <CheckLine
                  label="Signal reçu d’une session ouverte"
                  detail={
                    signal
                      ? sinceNow(signal, now)
                      : 'Ouvre une session Claude Code dans ce profil pour terminer la vérification'
                  }
                  done={Boolean(signal)}
                />
              </ul>
              {status?.installed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start text-muted"
                  disabled={busy}
                  onClick={onUninstall}
                >
                  Désinstaller
                </Button>
              )}
            </div>
          )}
        </div>
        <footer className="flex justify-end gap-2 border-t border-line pt-4">
          {index > 0 && (
            <Button variant="ghost" onClick={() => onStepChange(STEPS[index - 1]?.value ?? 'intro')}>
              Précédent
            </Button>
          )}
          {step === 'intro' && <Button onClick={() => onStepChange('install')}>Suivant</Button>}
          {step === 'install' && (
            <Button disabled={busy} onClick={() => onInstall(backup)}>
              {status?.installed ? 'Réinstaller' : 'Installer'}
            </Button>
          )}
          {step === 'check' && (
            <Button asChild>
              <Link href="/">Terminer</Link>
            </Button>
          )}
        </footer>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

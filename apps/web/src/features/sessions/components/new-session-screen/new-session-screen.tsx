'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, MessageSquare, Monitor, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PilotSettingsDto, SessionDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { pilotOptionsQuery, startSession, suggestions } from '../../api/pilot';
import { sessionsQuery } from '../../api/sessions';
import { Composer, type ComposerValue } from '../composer';
import { DEFAULT_SETTINGS } from '../pilot-panel';

/** Une session du terminal encore vivante dans ce dossier : deux agents y modifieraient les mêmes fichiers. */
function openIn(sessions: readonly SessionDto[], root: string): null | SessionDto {
  return (
    sessions.find(
      (session) =>
        session.repository?.root === root &&
        !session.pilot &&
        !session.task &&
        (session.openInTerminal || session.state === 'running' || session.state === 'waiting'),
    ) ?? null
  );
}

/**
 * Nouvelle session (E16a, CA-SESS-91) : le dépôt et l'abonnement Claude, puis le premier message, avec les réglages
 * du tour dans la barre d'outils. Elle démarre sur le poste, dans le dossier du dépôt, et s'ouvre dans Bosco.
 */
export function NewSessionScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data: options } = useQuery(pilotOptionsQuery);
  const { data: sessions } = useQuery(sessionsQuery);
  const [chosenRepository, setRepository] = useState<null | string>(null);
  const [chosenProfile, setProfile] = useState<null | string>(null);
  const [settings, setSettings] = useState<PilotSettingsDto>(DEFAULT_SETTINGS);
  if (!options) return <PageSkeleton variant="detail" rows={6} />;
  const repository =
    options.repositories.find(({ root }) => root === chosenRepository) ?? options.repositories[0] ?? null;
  const profile = chosenProfile ?? repository?.defaultProfile ?? options.profiles[0]?.path ?? null;
  const busy = repository ? openIn(sessions ?? [], repository.root) : null;
  const submit = async (value: ComposerValue) => {
    if (!repository) return;
    try {
      const sessionId = await startSession({ ...value, profile, repository: repository.root, settings });
      await client.invalidateQueries({ queryKey: ['sessions'] });
      router.push(`/sessions/${sessionId}`);
    } catch (error) {
      push(error instanceof Error ? error.message : 'La session n’a pas démarré.', 'warning');
      throw error;
    }
  };
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <div className="flex items-end gap-3">
        <div className="min-w-0">
          <p className="hidden text-xs text-muted md:block">Vue d’ensemble › Nouvelle session</p>
          <h1 className="mt-1 hidden font-display text-2xl font-semibold tracking-tight md:block">Nouvelle session</h1>
        </div>
        <Link href="/" className="ml-auto link text-sm text-muted">
          Annuler
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
          {repository ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-sm font-medium">Dépôt</span>
                  <select
                    className="select w-full"
                    value={repository.root}
                    onChange={(event) => {
                      setRepository(event.target.value);
                      setProfile(null);
                    }}
                  >
                    {options.repositories.map(({ name, root }) => (
                      <option key={root} value={root}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <span className="truncate font-mono text-xs text-muted">{repository.root}</span>
                </label>
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-sm font-medium">Abonnement Claude</span>
                  <select
                    className="select w-full"
                    value={profile ?? ''}
                    onChange={(event) => setProfile(event.target.value || null)}
                  >
                    {options.profiles.length === 0 && <option value="">Aucun profil avec un accès Claude</option>}
                    {options.profiles.map(({ account, label, path }) => (
                      <option key={path} value={path}>
                        {label}
                        {account ? ` · ${account}` : ''}
                        {path === repository.defaultProfile ? ' · défaut du dépôt' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {busy && (
                <div role="alert" className="alert alert-soft alert-warning">
                  <TriangleAlert aria-hidden className="size-4" />
                  <span>
                    Une session est déjà ouverte dans ce dossier, dans un terminal : les deux agents modifieraient les
                    mêmes fichiers.{' '}
                    <Link href={`/sessions/${busy.id}`} className="link font-medium">
                      Voir la session
                    </Link>
                  </span>
                </div>
              )}
              <Composer
                label="Premier message"
                placeholder="Que doit faire l’agent ?"
                settings={settings}
                onSettingsChange={setSettings}
                onSubmit={submit}
                suggest={(kind, query) => suggestions({ profile, repository: repository.root }, kind, query)}
                submitLabel="Démarrer"
                minRows={4}
              />
            </>
          ) : (
            <p className="rounded-card border border-line bg-surface p-4 text-muted">
              Aucun dépôt connu : Bosco découvre les dépôts par les sessions des profils surveillés.
            </p>
          )}
        </div>
        <aside className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm shadow-card">
          <h2 className="font-semibold">Récapitulatif</h2>
          <p className="text-xs font-semibold text-muted">Où elle tourne</p>
          <p className="flex gap-2">
            <Monitor aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            Sur ce poste, dans le dossier du dépôt, comme dans un terminal.
          </p>
          <p className="text-xs font-semibold text-muted">Ensuite</p>
          <p className="flex gap-2">
            <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            Elle s’ouvre dans Bosco : tu lui écris depuis le poste ou le téléphone.
          </p>
          <p className="flex gap-2">
            <SquareTerminal aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            Elle se reprend aussi dans un terminal entre deux tours.
          </p>
          <div className="rounded-control border border-dashed border-line-strong p-3 text-xs text-muted">
            Pour un travail isolé, avec budget et revue, crée plutôt une tâche.
            <Link href="/tasks/new" className="mt-1 flex items-center gap-1 font-medium text-ink hover:underline">
              Nouvelle tâche
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Box,
  Download,
  EyeOff,
  GitBranch,
  Globe,
  KeyRound,
  MessageSquare,
  Monitor,
  Moon,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
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

/** Récapitulatif d'une session sur le poste (E16a). */
function WorkstationSummary() {
  return (
    <>
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
    </>
  );
}

/** Récapitulatif d'une session en bac à sable (E16b, règle 12) : ce que voit l'agent, et comment le travail revient. */
function SandboxSummary({ branch, name }: { branch: string; name: string }) {
  return (
    <>
      <p className="flex gap-2">
        <Box aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Dans un bac à sable sur ce poste, isolé comme un agent du worker.
      </p>
      <p className="text-xs font-semibold text-muted">Ce que voit l’agent</p>
      <p className="flex gap-2">
        <GitBranch aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Une copie de {name}, sur {branch}
      </p>
      <p className="flex gap-2">
        <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        L’accès à l’abonnement choisi
      </p>
      <p className="flex gap-2">
        <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Les domaines de la sortie réseau du worker
      </p>
      <p className="flex gap-2 text-muted">
        <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
        Rien d’autre du poste : ni fichiers, ni accès, ni autres dépôts
      </p>
      <p className="text-xs font-semibold text-muted">Ensuite</p>
      <p className="flex gap-2">
        <Download aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />« Récupérer la branche » ramène le travail
        dans le dépôt, quand tu veux.
      </p>
      <p className="flex gap-2">
        <Moon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Le bac à sable s’arrête après 30 min sans message, sans rien perdre.
      </p>
    </>
  );
}

/**
 * Nouvelle session (E16a, E16b, CA-SESS-91, CA-SESS-106) : le dépôt et l'abonnement Claude, où elle tourne (sur le
 * poste ou dans un bac à sable, sur sa propre branche), puis le premier message, avec les réglages du tour dans la
 * barre d'outils. Elle s'ouvre dans Bosco.
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
  const [where, setWhere] = useState<'sandbox' | 'workstation'>('workstation');
  const [startBranch, setStartBranch] = useState<null | string>(null);
  const [branch, setBranch] = useState('');
  if (!options) return <PageSkeleton variant="detail" rows={6} />;
  const repository =
    options.repositories.find(({ root }) => root === chosenRepository) ?? options.repositories[0] ?? null;
  const profile = chosenProfile ?? repository?.defaultProfile ?? options.profiles[0]?.path ?? null;
  const sandboxed = where === 'sandbox' && !options.sandboxUnavailable;
  // Le bac à sable travaille sur sa propre copie : une session du terminal dans le même dossier ne le gêne pas
  const busy = repository && !sandboxed ? openIn(sessions ?? [], repository.root) : null;
  const from = startBranch ?? repository?.branch ?? '';
  const choose = (next: 'sandbox' | 'workstation') => {
    setWhere(next);
    // L'agent ne peut abîmer que sa copie : les modifications passent sans demander (E16b)
    if (next === 'sandbox' && settings.permissionMode === 'ask')
      setSettings({ ...settings, permissionMode: 'acceptEdits' });
  };
  const submit = async (value: ComposerValue) => {
    if (!repository) return;
    try {
      const sandbox = sandboxed ? { branch: branch.trim() || null, startBranch: from.trim() || null } : null;
      const sessionId = await startSession({ ...value, profile, repository: repository.root, settings, sandbox });
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
              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-sm font-medium">Où elle tourne</legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2">
                    <input
                      type="radio"
                      name="where"
                      className="radio radio-sm"
                      checked={where === 'workstation'}
                      onChange={() => choose('workstation')}
                    />
                    <Monitor aria-hidden className="size-4 text-muted" />
                    Sur le poste
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2">
                    <input
                      type="radio"
                      name="where"
                      className="radio radio-sm"
                      checked={where === 'sandbox'}
                      disabled={Boolean(options.sandboxUnavailable)}
                      onChange={() => choose('sandbox')}
                    />
                    <Box aria-hidden className="size-4 text-muted" />
                    Bac à sable
                  </label>
                </div>
                {options.sandboxUnavailable && (
                  <span className="text-xs text-muted">Bac à sable indisponible : {options.sandboxUnavailable}.</span>
                )}
              </fieldset>
              {sandboxed && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-sm font-medium">Partir de</span>
                    <input
                      className="input w-full font-mono"
                      value={from}
                      onChange={(event) => setStartBranch(event.target.value)}
                    />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-sm font-medium">Branche de la session</span>
                    <input
                      className="input w-full font-mono"
                      placeholder="bosco/s-… d’après le premier message"
                      value={branch}
                      onChange={(event) => setBranch(event.target.value)}
                    />
                  </label>
                  <p className="text-xs text-muted sm:col-span-2">
                    Copie de {from || 'la branche courante'} telle qu’enregistrée : les fichiers modifiés du poste ne
                    sont pas copiés.
                  </p>
                </div>
              )}
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
          {sandboxed && repository ? (
            <SandboxSummary name={repository.name} branch={branch.trim() || 'sa propre branche'} />
          ) : (
            <WorkstationSummary />
          )}
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

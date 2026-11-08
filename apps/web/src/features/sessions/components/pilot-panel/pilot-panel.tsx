'use client';
import { useQueryClient } from '@tanstack/react-query';
import { Info, SquareTerminal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { PilotSettingsDto, SessionDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import { interruptTurn, sendMessage, suggestions } from '../../api/pilot';
import { Composer, type ComposerValue } from '../composer';

/** Réglages d'une session qui n'a encore jamais été pilotée : Demander, modèle et effort du profil. */
export const DEFAULT_SETTINGS: PilotSettingsDto = { effort: null, model: null, permissionMode: 'ask' };

/** Peut-on écrire à la session depuis Bosco ? Pilotée, ou close ; jamais ouverte dans un terminal (règles 4 et 9). */
export function writable(session: SessionDto): boolean {
  if (session.task || session.openInTerminal) return false;
  return session.pilot !== null || session.state === 'ended' || session.state === 'inactive';
}

/**
 * Sous le fil d'une session (E2e, E2f, E2g, E2a) : la zone de message d'une session pilotée ou close ; la bande
 * « Ouverte dans un terminal » sinon. Une session du worker se relit dans sa tâche : rien ici.
 */
export function PilotPanel({ session }: { session: SessionDto }) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const [settings, setSettings] = useState<PilotSettingsDto>(session.pilot?.settings ?? DEFAULT_SETTINGS);
  if (session.task) return null;
  const inTerminal = !writable(session);
  if (inTerminal && !session.channel) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line bg-surface-alt px-4 py-3 text-sm text-muted">
        <SquareTerminal aria-hidden className="size-4 shrink-0" />
        Ouverte dans un terminal · réponds-y là-bas.
        <Link href={`/sources?canal=${encodeURIComponent(session.sourceId)}`} className="link link-primary">
          Lancer tes sessions avec le canal de Bosco pour leur écrire d’ici
        </Link>
      </p>
    );
  }
  const asking = session.waiting?.kind === 'question';
  const closed = session.pilot === null && !inTerminal;
  const place = session.repository
    ? [session.repository.name, session.repository.folder].filter(Boolean).join('/')
    : session.repoPath;
  const submit = async (value: ComposerValue) => {
    try {
      const status = await sendMessage(session.id, { ...value, settings });
      await client.invalidateQueries({ queryKey: ['session', session.id] });
      if (status === 'queued') push('Message en attente : il partira à la fin du tour.', 'info');
      if (status === 'channel') push('Message envoyé dans le terminal par le canal de Bosco.', 'success');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Le message n’est pas parti.', 'warning');
      throw error;
    }
  };
  const stop = () => {
    interruptTurn(session.id).catch((error: unknown) =>
      push(error instanceof Error ? error.message : 'Le tour ne s’est pas arrêté.', 'warning'),
    );
  };
  return (
    // Sur le téléphone, la page défile : la zone de message reste en bas de l’écran (E2e)
    <div className="rounded-b-card border-t border-line bg-surface max-md:sticky max-md:bottom-0 max-md:z-10">
      {closed && (
        <p className="flex items-center gap-2 bg-surface-alt px-4 py-2 text-xs text-muted">
          <Info aria-hidden className="size-3.5 shrink-0" />
          <span>
            Session close · ton message la reprend dans Bosco, sur ce poste
            {place && (
              <>
                , dans <span className="font-mono">{place}</span>
              </>
            )}
          </span>
        </p>
      )}
      <div className="p-3">
        <Composer
          label="Message à l’agent"
          placeholder={placeholderOf(asking, closed)}
          settings={settings}
          onSettingsChange={setSettings}
          onSubmit={submit}
          suggest={(kind, query) => suggestions({ sessionId: session.id }, kind, query)}
          running={session.pilot?.running ?? false}
          onStop={stop}
          disabled={asking}
          textOnly={inTerminal ? 'Ouverte dans un terminal · ton message y arrive par le canal de Bosco' : undefined}
        />
      </div>
    </div>
  );
}

function placeholderOf(asking: boolean, closed: boolean): string {
  if (asking) return 'Réponds d’abord à la question';
  // Session du terminal avec son canal (E2i), ou pilotée par Bosco
  return closed ? 'Écris pour reprendre la session ici…' : 'Écris à l’agent…';
}

'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JournalEntryDto, SessionDto } from '@bosco/domain';
import { sessionDetailQuery, sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useCopy } from '../../hooks/use-copy';
import { useLiveEvents } from '../../hooks/use-live-events';
import { useNow } from '../../hooks/use-now';
import { usePermissionAnswers } from '../../hooks/use-permission-answers';
import { useOffline } from '../../lib/connection';
import { profileOf, resumeCommand } from '../../lib/detail';
import { profileMark, waitingSessions } from '../../lib/overview';
import { useSettlements } from '../../lib/settlements';
import { AllowDialog } from '../allow-dialog';
import { ConnectionStatus } from '../connection-status';
import { Notices } from '../notices';
import { PermissionCard } from '../permission-card';
import { SessionFeed } from '../session-feed';
import { SessionHeader } from '../session-header';
import { SessionSide } from '../session-side';

/** Ce que l'agent a dit juste avant de demander l'autorisation. */
function agentSays(journal: JournalEntryDto[], session: SessionDto): null | string {
  const since = session.waiting?.since;
  if (!since) return null;
  return journal.filter((entry) => entry.kind === 'reply' && entry.at <= since).at(-1)?.text ?? null;
}

/**
 * Détail d'une session (E2a, E2b) : le fil en direct, et la carte d'autorisation quand l'agent attend. Après une
 * réponse, retour à la vue d'ensemble s'il reste d'autres sessions en attente ; sinon le fil repart (CA-SESS-36).
 */
export function SessionDetailScreen({ id }: { id: string }) {
  const now = useNow();
  const router = useRouter();
  const copy = useCopy();
  useLiveEvents(true);
  const { data: sources } = useQuery(sourcesQuery);
  const { data: sessions } = useQuery(sessionsQuery);
  const { data, isError } = useQuery(sessionDetailQuery(id));
  const settlement = useSettlements((state) => state.settlements[id] ?? null);
  const offline = useOffline();
  const answers = usePermissionAnswers({
    onAnswered: (answered) => {
      if (waitingSessions(sessions ?? []).some((session) => session.id !== answered.id)) router.push('/');
    },
  });
  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 p-4 md:px-8 md:pt-6">
        <h1 className="font-display text-xl font-semibold">Session introuvable</h1>
        <Link href="/" className="link link-primary">
          Revenir à la vue d’ensemble
        </Link>
      </div>
    );
  }
  if (!data || !sources) return null;
  const { journal, session } = data;
  const resume = resumeCommand(session, sources.sources, sources.home);
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 md:h-full md:px-8 md:pt-6">
      <ConnectionStatus />
      <SessionHeader
        session={session}
        now={now}
        mark={profileMark(session, sources.sources)}
        profile={profileOf(session, sources.sources)}
        resume={resume}
        onCopy={copy}
      />
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-3">
        <div className="flex min-h-0 flex-col md:col-span-2">
          <SessionFeed
            session={session}
            journal={journal}
            now={now}
            tail={
              <PermissionCard
                session={session}
                now={now}
                agentSays={agentSays(journal, session)}
                settlement={settlement}
                busy={answers.busyId === session.id || offline}
                onAllow={() => answers.onAllow(session)}
                onDeny={(reason) => answers.deny(session, reason)}
              />
            }
          />
        </div>
        <SessionSide session={session} now={now} resume={resume} onCopy={copy} />
      </div>
      <AllowDialog session={answers.confirming} onCancel={answers.cancel} onConfirm={answers.confirm} />
      <Notices />
    </div>
  );
}

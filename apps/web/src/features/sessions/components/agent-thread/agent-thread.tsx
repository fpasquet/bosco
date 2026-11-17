'use client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/shared/ui/skeleton';
import { sessionConversationQuery } from '../../api/sessions';
import { ConversationView } from '../conversation-view';

/** Relecture du fil tant que l'agent travaille : seules les lignes ajoutées au transcript sont lues. */
const CONVERSATION_REFRESH_MS = 5000;

export interface AgentThreadProps {
  id: string;
  /** Consigne de la tâche, affichée en tête à la place du texte transmis */
  instruction: string;
  /** L'agent travaille : le fil se relit, l'étape sans résultat est en cours */
  live: boolean;
}

/**
 * Fil complet de la session de l'agent d'une tâche (RF-TACH-10), lu dans son transcript comme le détail d'une session.
 * La page de la tâche le place dans son écran : la tâche n'a pas à connaître les sessions.
 */
export function AgentThread({ id, instruction, live }: AgentThreadProps) {
  const { data: conversation, isPending } = useQuery({
    ...sessionConversationQuery(id),
    refetchInterval: live ? CONVERSATION_REFRESH_MS : false,
  });
  if (isPending)
    return (
      <div role="status" aria-busy className="flex flex-col gap-3">
        <span className="sr-only">Chargement du fil…</span>
        <Skeleton className="ml-auto h-12 w-2/3" />
        {['w-1/3', 'w-5/6', 'w-1/2'].map((width) => (
          <Skeleton key={width} className={`h-4 ${width}`} />
        ))}
      </div>
    );
  if (!conversation || conversation.turns.length === 0)
    return <p className="text-muted">Le fil de l’agent n’est pas encore lisible.</p>;
  return <ConversationView conversation={conversation} instruction={instruction} live={live} />;
}

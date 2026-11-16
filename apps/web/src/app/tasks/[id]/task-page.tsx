'use client';
import { AgentThread } from '@/features/sessions/components/agent-thread';
import { TaskDetailScreen } from '@/features/tasks/components/task-detail-screen';

/**
 * Écran d'une tâche, assemblé ici parce qu'il réunit deux fonctionnalités : la tâche, et le fil de la session de son
 * agent, rendu comme dans le détail d'une session (RF-TACH-10).
 */
export function TaskPage({ id }: { id: number }) {
  return (
    <TaskDetailScreen
      id={id}
      thread={(task) =>
        task.outcome.sessionId ? (
          <AgentThread id={task.outcome.sessionId} instruction={task.instruction} live={task.state === 'running'} />
        ) : null
      }
    />
  );
}

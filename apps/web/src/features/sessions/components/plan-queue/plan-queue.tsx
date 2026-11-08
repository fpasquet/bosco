import { CircleCheckIcon, CircleIcon, ListChecksIcon, ListTodoIcon, LoaderCircleIcon } from 'lucide-react';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import type { Todo } from '../../lib/conversation';

export interface PlanQueueProps {
  /** La session tourne : la tâche en cours tourne aussi */
  live: boolean;
  todos: Todo[];
}

function TodoLine({ live, todo }: { live: boolean; todo: Todo }) {
  const running = live && todo.status === 'in_progress';
  return (
    <TraceLine status={running ? 'running' : undefined}>
      <TraceIcon>
        {running && <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />}
        {!running && (todo.status === 'completed' ? <CircleCheckIcon /> : <CircleIcon />)}
      </TraceIcon>
      <TraceTitle className={todo.status === 'in_progress' ? 'text-ink' : undefined}>{todo.content}</TraceTitle>
    </TraceLine>
  );
}

/** Queue : le plan de l'agent, ce qui reste à faire (ouvert) puis ce qui est fait (replié). */
export function PlanQueue({ live, todos }: PlanQueueProps) {
  const remaining = todos.filter((todo) => todo.status !== 'completed');
  const done = todos.filter((todo) => todo.status === 'completed');
  return (
    <Trace>
      {remaining.length > 0 && (
        <TraceCollapsible defaultOpen>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <ListTodoIcon />
              </TraceIcon>
              <TraceTitle>{remaining.length} à faire</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <Trace>
              {remaining.map((todo, index) => (
                // Le plan garde l'ordre de ses tâches : leur position est leur identité
                <TodoLine key={index} todo={todo} live={live} />
              ))}
            </Trace>
          </TraceCollapsibleContent>
        </TraceCollapsible>
      )}
      {done.length > 0 && (
        <TraceCollapsible>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceIcon>
                <ListChecksIcon />
              </TraceIcon>
              <TraceTitle>
                {done.length} {done.length > 1 ? 'faites' : 'faite'}
              </TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>
            <Trace>
              {done.map((todo, index) => (
                <TodoLine key={index} todo={todo} live={live} />
              ))}
            </Trace>
          </TraceCollapsibleContent>
        </TraceCollapsible>
      )}
    </Trace>
  );
}

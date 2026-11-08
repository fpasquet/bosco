import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import type { StepView } from '../../lib/conversation';
import { StepBody } from '../step-body';
import { StepIcon } from '../step-icon';

const LINE_STATUS = { done: undefined, error: 'error', interrupted: 'pending', running: 'running' } as const;

export interface ToolStepProps {
  live: boolean;
  view: StepView;
}

/**
 * Tool, Terminal, Test Results, Stack Trace : une ligne par outil, au présent tant qu'il tourne et au passé une fois
 * fini ; elle se déplie sur son résultat dès qu'il est arrivé.
 */
export function ToolStep({ live, view }: ToolStepProps) {
  const description = view.status === 'interrupted' ? 'interrompu' : view.duration;
  const line = (
    <TraceLine status={LINE_STATUS[view.status]}>
      <TraceIcon>
        <StepIcon icon={view.icon} status={view.status} />
      </TraceIcon>
      <TraceTitle title={view.title}>{view.title}</TraceTitle>
      {description && <TraceDescription>{description}</TraceDescription>}
    </TraceLine>
  );
  if (!view.body) return line;
  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <StepBody body={view.body} live={live} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

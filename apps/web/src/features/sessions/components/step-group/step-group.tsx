import { ListChecksIcon, LoaderCircleIcon } from 'lucide-react';
import type { ConversationStepDto } from '@bosco/domain';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import { stepView, summarizeSteps, TASK_THRESHOLD } from '../../lib/conversation';
import { ReasoningStep } from '../reasoning-step';
import { ToolStep } from '../tool-step';

export interface StepGroupProps {
  /** Dernier groupe d'une session qui tourne : la tâche reste ouverte sur l'étape en cours */
  current: boolean;
  live: boolean;
  steps: ConversationStepDto[];
}

function Steps({ live, steps }: Omit<StepGroupProps, 'current'>) {
  return (
    <Trace>
      {steps.map((step) =>
        step.kind === 'reasoning' ? (
          <ReasoningStep key={`r-${step.at}`} seconds={step.seconds} text={step.text} />
        ) : (
          <ToolStep key={step.id} view={stepView(step, live)} live={live} />
        ),
      )}
    </Trace>
  );
}

/**
 * Étapes de l'agent entre deux textes. Peu nombreuses, elles s'affichent telles quelles ; au-delà, elles se replient
 * sous une tâche (Task) qui les résume, ouverte tant que l'agent y travaille.
 */
export function StepGroup({ current, live, steps }: StepGroupProps) {
  if (steps.length < TASK_THRESHOLD) return <Steps steps={steps} live={live} />;
  const views = steps.flatMap((step) => (step.kind === 'tool' ? [stepView(step, live)] : []));
  const running = views.some((view) => view.status === 'running');
  const failed = views.filter((view) => view.status === 'error').length;
  const failures = failed > 0 ? ` · ${failed} en échec` : '';
  return (
    <Trace>
      <TraceCollapsible defaultOpen={current}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? 'running' : undefined}>
            <TraceIcon>
              {running ? <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" /> : <ListChecksIcon />}
            </TraceIcon>
            <TraceTitle>
              {summarizeSteps(steps)}
              {failures}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Steps steps={steps} live={live} />
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

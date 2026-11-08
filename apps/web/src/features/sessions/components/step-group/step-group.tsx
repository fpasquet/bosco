'use client';
import { CircleXIcon, ListChecksIcon, LoaderCircleIcon } from 'lucide-react';
import { useState } from 'react';
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
  /** Dernier groupe d'un agent qui travaille : le résumé reste ouvert sur l'étape en cours */
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

function SummaryIcon({ failed, running }: { failed: boolean; running: boolean }) {
  if (running) return <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />;
  return failed ? <CircleXIcon /> : <ListChecksIcon />;
}

/**
 * Étapes de l'agent entre deux textes. Peu nombreuses, elles s'affichent telles quelles ; au-delà, elles se replient
 * sous un résumé (Chain of Thought), ouvert tant que l'agent y travaille, sauf si la personne l'a ouvert ou fermé.
 */
export function StepGroup({ current, live, steps }: StepGroupProps) {
  const [open, setOpen] = useState<boolean>();
  if (steps.length < TASK_THRESHOLD) return <Steps steps={steps} live={live} />;
  const views = steps.flatMap((step) => (step.kind === 'tool' ? [stepView(step, live)] : []));
  const running = current && views.some((view) => view.status === 'running');
  const failed = views.filter((view) => view.status === 'error').length;
  const failures = failed > 0 ? ` · ${failed} en échec` : '';
  const status = failed > 0 ? 'error' : undefined;
  return (
    <Trace>
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? 'running' : status}>
            <TraceIcon>
              <SummaryIcon running={running} failed={failed > 0} />
            </TraceIcon>
            <TraceTitle>
              {running ? 'Travaille · ' : ''}
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

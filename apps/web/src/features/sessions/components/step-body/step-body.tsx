import { CheckIcon, CircleDashedIcon, FileCodeIcon, LayersIcon, XIcon } from 'lucide-react';
import { HighlightedCode } from '@/shared/components/highlighted-code';
import { TerminalOutput } from '@/shared/components/terminal-output';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import type { StepBody as StepBodyView, TestCase } from '../../lib/conversation';
import { PlanQueue } from '../plan-queue';
import { SearchResults } from '../search-results';
import { SubagentWork } from '../subagent-work';

const OUTPUT = 'max-h-64';

function TestLine({ test }: { test: TestCase }) {
  const Icon = { failed: XIcon, passed: CheckIcon, skipped: CircleDashedIcon }[test.status];
  return (
    <TraceLine status={{ failed: 'error' as const, passed: undefined, skipped: 'pending' as const }[test.status]}>
      <TraceIcon>
        <Icon />
      </TraceIcon>
      <TraceTitle>{test.name}</TraceTitle>
    </TraceLine>
  );
}

/** Test Results : les cas lus dans la sortie, en échec d'abord, puis la sortie complète. */
function TestsBody({ command, output, tests }: { command: string; output: string; tests: TestCase[] }) {
  const ordered = [...tests].sort((a, b) => Number(b.status === 'failed') - Number(a.status === 'failed'));
  return (
    <div className="flex flex-col gap-3">
      {ordered.length > 0 && (
        <Trace>
          {ordered.map((test, index) => (
            // deux cas peuvent porter le même nom
            <TestLine key={index} test={test} />
          ))}
        </Trace>
      )}
      <TerminalOutput command={command} output={output} className={OUTPUT} />
    </div>
  );
}

/** Stack Trace : l'erreur en entier, les appels du projet d'abord, ceux des dépendances repliés. */
function StackBody({ error, frames }: { error: string; frames: { internal: boolean; line: string }[] }) {
  const own = frames.filter((frame) => !frame.internal);
  const internal = frames.filter((frame) => frame.internal);
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs wrap-break-word text-danger">{error}</p>
      <Trace>
        {own.map((frame, index) => (
          // une pile peut répéter un appel
          <TraceLine key={index}>
            <TraceIcon>
              <FileCodeIcon />
            </TraceIcon>
            <TraceTitle className="font-mono text-xs">{frame.line}</TraceTitle>
          </TraceLine>
        ))}
        {internal.length > 0 && (
          <TraceCollapsible>
            <TraceCollapsibleTrigger>
              <TraceLine>
                <TraceIcon>
                  <LayersIcon />
                </TraceIcon>
                <TraceTitle>
                  {internal.length} {internal.length > 1 ? 'appels internes' : 'appel interne'}
                </TraceTitle>
              </TraceLine>
            </TraceCollapsibleTrigger>
            <TraceCollapsibleContent>
              <ol className="flex flex-col gap-1 font-mono text-xs">
                {internal.map((frame, index) => (
                  // une pile peut répéter un appel
                  <li key={index}>{frame.line}</li>
                ))}
              </ol>
            </TraceCollapsibleContent>
          </TraceCollapsible>
        )}
      </Trace>
    </div>
  );
}

export interface StepBodyProps {
  body: StepBodyView;
  /** La session tourne : la tâche en cours du plan tourne aussi */
  live: boolean;
}

/** Ce qu'une étape montre une fois dépliée : sortie, diff, cas de tests, pile d'appels, plan ou sous-agent. */
export function StepBody({ body, live }: StepBodyProps) {
  switch (body.kind) {
    case 'terminal':
      return <TerminalOutput command={body.command} output={body.output} className={OUTPUT} />;
    case 'tests':
      return <TestsBody command={body.command} output={body.output} tests={body.tests} />;
    case 'stack':
      return <StackBody error={body.error} frames={body.frames} />;
    case 'diff':
      return (
        <HighlightedCode
          code={body.lines.map((line) => line.text).join('\n')}
          language={body.language}
          variants={body.lines.map((line) => line.variant)}
          size="sm"
          className={OUTPUT}
        />
      );
    case 'code':
      return <HighlightedCode code={body.code} language={body.language} size="sm" className={OUTPUT} />;
    case 'plan':
      return <PlanQueue todos={body.todos} live={live} />;
    case 'search':
      return <SearchResults links={body.links} />;
    case 'subagent':
      return (
        <SubagentWork
          agentType={body.agentType}
          live={live}
          model={body.model}
          parts={body.parts}
          partial={body.partial}
          prompt={body.prompt}
          result={body.result}
        />
      );
  }
}

import {
  CheckIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  FileCodeIcon,
  LayersIcon,
  LoaderCircleIcon,
  XIcon,
} from 'lucide-react';
import { HighlightedCode } from '@/shared/components/highlighted-code';
import { Markdown } from '@/shared/components/markdown';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import type { StepBody as StepBodyView, TestCase, Todo } from '../../lib/conversation';

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
function TestsBody({ output, tests }: { output: string; tests: TestCase[] }) {
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
      <HighlightedCode code={output} size="sm" wrap className={OUTPUT} />
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

function TodoLine({ live, todo }: { live: boolean; todo: Todo }) {
  if (todo.status === 'completed')
    return (
      <TraceLine>
        <TraceIcon>
          <CircleCheckIcon />
        </TraceIcon>
        <TraceTitle className="line-through">{todo.content}</TraceTitle>
      </TraceLine>
    );
  if (todo.status === 'in_progress')
    return (
      <TraceLine status={live ? 'running' : undefined}>
        <TraceIcon>
          {live ? <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" /> : <CircleIcon />}
        </TraceIcon>
        <TraceTitle className="text-ink">{todo.content}</TraceTitle>
      </TraceLine>
    );
  return (
    <TraceLine status="pending">
      <TraceIcon>
        <CircleIcon />
      </TraceIcon>
      <TraceTitle>{todo.content}</TraceTitle>
    </TraceLine>
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
      return <HighlightedCode code={body.output || '(aucune sortie)'} size="sm" wrap className={OUTPUT} />;
    case 'tests':
      return <TestsBody output={body.output} tests={body.tests} />;
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
      return (
        <Trace>
          {body.todos.map((todo, index) => (
            // le plan garde l'ordre de ses tâches
            <TodoLine key={index} todo={todo} live={live} />
          ))}
        </Trace>
      );
    case 'subagent':
      return (
        <div className="flex flex-col gap-2">
          <p className="line-clamp-3 whitespace-pre-line">{body.prompt}</p>
          {body.result && <Markdown>{body.result}</Markdown>}
        </div>
      );
  }
}

import { ArrowUpRightIcon, GlobeIcon } from 'lucide-react';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';
import type { Source } from '../../lib/conversation';
import { hostOf } from '../../lib/conversation';

/** Sources : les pages lues ou trouvées par l'agent pendant son tour, une ligne par page, ouverte dans un onglet. */
export function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <GlobeIcon />
            </TraceIcon>
            <TraceTitle>
              {sources.length} {sources.length > 1 ? 'sources' : 'source'}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <TraceLine>
                  <TraceIcon>
                    <GlobeIcon />
                  </TraceIcon>
                  <TraceTitle>
                    {source.title ?? hostOf(source.url)}
                    <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
                  </TraceTitle>
                  <TraceIcon>
                    <ArrowUpRightIcon />
                  </TraceIcon>
                </TraceLine>
              </a>
            ))}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

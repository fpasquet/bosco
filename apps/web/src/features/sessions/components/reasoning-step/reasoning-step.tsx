import { BrainIcon } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/shared/components/markdown';
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/shared/ui/trace';

export interface ReasoningStepProps {
  seconds: null | number;
  /** Vide quand le modèle garde sa réflexion pour lui : la ligne ne se déplie pas */
  text: string;
}

/** Reasoning : « A réfléchi », sa durée, et son texte replié ; le choix d'ouvrir ou de fermer revient à la personne. */
export function ReasoningStep({ seconds, text }: ReasoningStepProps) {
  const [open, setOpen] = useState(false);
  const line = (
    <TraceLine>
      <TraceIcon>
        <BrainIcon />
      </TraceIcon>
      <TraceTitle>A réfléchi</TraceTitle>
      {seconds !== null && seconds > 0 && <TraceDescription>{seconds} s</TraceDescription>}
    </TraceLine>
  );
  if (!text) return line;
  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Markdown className="text-muted">{text}</Markdown>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

'use client';
import { MessageCircleQuestion } from 'lucide-react';
import { useState } from 'react';
import type { AgentQuestionDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { elapsed } from '../../lib/format';

export interface QuestionCardProps {
  busy: boolean;
  now: Date;
  /** Réponses, une liste de choix par question ; null pour « Passer » */
  onAnswer: (answers: null | string[][]) => void;
  questions: AgentQuestionDto[];
  since: string;
}

const OTHER = '__other__';

/**
 * Question de l'agent au bout du fil (E2f, CA-SESS-96) : ses choix en liste, « Autre » en texte libre, « Passer ». Une
 * question à choix multiples se coche ; plusieurs questions se suivent dans la même carte.
 */
export function QuestionCard({ busy, now, onAnswer, questions, since }: QuestionCardProps) {
  const [chosen, setChosen] = useState<string[][]>(() => questions.map(() => []));
  const [others, setOthers] = useState<string[]>(() => questions.map(() => ''));
  const answers = questions.map((_, index) =>
    (chosen[index] ?? []).map((choice) => (choice === OTHER ? (others[index] ?? '').trim() : choice)).filter(Boolean),
  );
  const complete = answers.every((answer) => answer.length > 0);
  const toggle = (index: number, value: string, multiple: boolean) =>
    setChosen((current) =>
      current.map((choices, at) => {
        if (at !== index) return choices;
        if (!multiple) return [value];
        return choices.includes(value) ? choices.filter((choice) => choice !== value) : [...choices, value];
      }),
    );
  return (
    <section aria-label="Question de l’agent" className="mt-4 rounded-card border border-warning bg-surface">
      <h3 className="flex items-center gap-2 rounded-t-card bg-warning-soft px-4 py-2.5 font-semibold text-warning">
        <MessageCircleQuestion aria-hidden className="size-4" />
        L’agent te pose une question
        <span className="ml-auto text-xs font-normal">il y a {elapsed(new Date(since), now)}</span>
      </h3>
      <div className="flex flex-col gap-4 p-4">
        {questions.map((question, index) => {
          const multiple = question.multiSelect;
          const type = multiple ? 'checkbox' : 'radio';
          const name = `question-${index}`;
          return (
            <fieldset key={question.question} className="flex flex-col gap-2">
              <legend className="mb-2 font-medium">{question.question}</legend>
              {question.options.map((option) => (
                <label
                  key={option.label}
                  className="flex cursor-pointer items-start gap-3 rounded-control border border-line px-3 py-2.5 has-checked:border-primary has-checked:bg-primary-soft"
                >
                  <input
                    type={type}
                    name={name}
                    className={multiple ? 'checkbox mt-0.5 checkbox-sm' : 'radio mt-0.5 radio-sm'}
                    checked={(chosen[index] ?? []).includes(option.label)}
                    disabled={busy}
                    onChange={() => toggle(index, option.label, multiple)}
                  />
                  <span className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description && <span className="text-xs text-muted">{option.description}</span>}
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-3 rounded-control border border-line px-3 py-2 has-checked:border-primary">
                <input
                  type={type}
                  name={name}
                  className={multiple ? 'checkbox checkbox-sm' : 'radio radio-sm'}
                  checked={(chosen[index] ?? []).includes(OTHER)}
                  disabled={busy}
                  onChange={() => toggle(index, OTHER, multiple)}
                />
                <span className="font-medium">Autre</span>
                <input
                  type="text"
                  aria-label={`Autre réponse à « ${question.question} »`}
                  className="input min-w-0 flex-1 input-sm"
                  placeholder="Précise ta réponse…"
                  value={others[index] ?? ''}
                  disabled={busy}
                  onFocus={() => {
                    if (!(chosen[index] ?? []).includes(OTHER)) toggle(index, OTHER, multiple);
                  }}
                  onChange={(event) =>
                    setOthers((current) => current.map((text, at) => (at === index ? event.target.value : text)))
                  }
                />
              </label>
            </fieldset>
          );
        })}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onAnswer(null)}>
            Passer
          </Button>
          <Button variant="primary" size="sm" disabled={busy || !complete} onClick={() => onAnswer(answers)}>
            Répondre
          </Button>
        </div>
      </div>
    </section>
  );
}

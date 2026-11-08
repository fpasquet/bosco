import { DomainError } from '../../shared/domain/domain-error.ts';

/** Proposée par un agent, acceptée par toi, refusée, remplacée par une autre, ou abandonnée (RF-CONT-02, RF-CONT-11). */
export type DecisionState = 'abandoned' | 'accepted' | 'proposed' | 'refused' | 'replaced';

/** Une décision porte sur un dépôt ou sur un socle (RF-CONT-03). */
export type DecisionTarget = { kind: 'repository'; name: string } | { kind: 'socle'; id: number };

/** Texte d'une décision, au format habituel : contexte, décision, conséquences, alternatives écartées. */
export interface DecisionText {
  alternatives: null | string;
  consequences: null | string;
  context: string;
  decision: string;
  title: string;
}

/** Version d'une décision : chaque changement garde son auteur, sa date et sa note (RF-CONT-10). */
export interface DecisionVersion extends DecisionText {
  at: Date;
  /** « toi », ou l'agent d'une tâche (« agent de T-12 ») */
  author: string;
  note: string;
}

export interface DecisionSnapshot {
  /** Décision d'un socle que celle-ci retire pour son dépôt (« fait exception à ») */
  exceptionTo: null | number;
  /** Tâche de l'agent qui l'a proposée */
  fromTask: null | number;
  id: number;
  /** Motif d'un refus ou d'un abandon */
  reason: null | string;
  /** Décision qui la remplace */
  replacedBy: null | number;
  /** Décisions qu'elle précise */
  specifies: number[];
  state: DecisionState;
  target: DecisionTarget;
  versions: DecisionVersion[];
}

export class DecisionError extends DomainError {}

export const PERSON = 'toi';

/** Titre, contexte et décision sont obligatoires (CA-CONT-12) ; le reste, facultatif, devient null s'il est vide. */
export function checkText(text: DecisionText): DecisionText {
  const clean = (value: null | string) => (value?.trim() ? value.trim() : null);
  if (!text.title.trim() || !text.context.trim() || !text.decision.trim())
    throw new DecisionError('decisionIncomplete', 'Titre, contexte et décision sont obligatoires.');
  return {
    title: text.title.trim(),
    context: text.context.trim(),
    decision: text.decision.trim(),
    consequences: clean(text.consequences),
    alternatives: clean(text.alternatives),
  };
}

export class Decision {
  private constructor(private snapshot: DecisionSnapshot) {}

  static restore(snapshot: DecisionSnapshot): Decision {
    return new Decision(snapshot);
  }

  /** Écrite par toi : acceptée tout de suite, ou gardée en proposition (CA-CONT-14). */
  static write(
    id: number,
    target: DecisionTarget,
    text: DecisionText,
    options: { accept: boolean; at: Date; exceptionTo: null | number },
  ): Decision {
    if (options.exceptionTo !== null && target.kind !== 'repository')
      throw new DecisionError('exceptionOnSocle', 'Seule une décision de dépôt fait exception à celle d’un socle.');
    return new Decision({
      id,
      target,
      state: options.accept ? 'accepted' : 'proposed',
      exceptionTo: options.exceptionTo,
      fromTask: null,
      reason: null,
      replacedBy: null,
      specifies: [],
      versions: [{ ...checkText(text), at: options.at, author: PERSON, note: 'Création' }],
    });
  }

  /** Proposée par l'agent d'une tâche : elle attend ta validation, et n'est transmise à personne (RF-CONT-02). */
  static propose(id: number, repository: string, text: DecisionText, taskId: null | number, at: Date): Decision {
    return new Decision({
      id,
      target: { kind: 'repository', name: repository },
      state: 'proposed',
      exceptionTo: null,
      fromTask: taskId,
      reason: null,
      replacedBy: null,
      specifies: [],
      versions: [
        { ...checkText(text), at, author: taskId ? `l’agent de T-${taskId}` : 'une session', note: 'Proposition' },
      ],
    });
  }

  get id(): number {
    return this.snapshot.id;
  }

  current(): DecisionVersion {
    return this.snapshot.versions.at(-1) as DecisionVersion;
  }

  toSnapshot(): DecisionSnapshot {
    return structuredClone(this.snapshot);
  }

  /** Accepter, éventuellement après l'avoir relue et modifiée : la version acceptée est celle relue (CA-CONT-08). */
  accept(at: Date, edited: DecisionText | null): void {
    this.expect('proposed');
    if (edited) this.addVersion(edited, at, 'Modifiée avant d’être acceptée');
    this.snapshot.state = 'accepted';
  }

  refuse(reason: null | string): void {
    this.expect('proposed');
    this.snapshot.state = 'refused';
    this.snapshot.reason = reason?.trim() || null;
  }

  /** Nouvelle version, avec une note obligatoire ; les précédentes restent lisibles (RF-CONT-11). */
  edit(text: DecisionText, note: string, at: Date): void {
    this.expect('accepted');
    if (!note.trim()) throw new DecisionError('noteMissing', 'Écris une note pour dire ce qui change.');
    this.addVersion(text, at, note.trim());
  }

  replace(by: number): void {
    this.expect('accepted');
    this.snapshot.state = 'replaced';
    this.snapshot.replacedBy = by;
  }

  abandon(reason: null | string): void {
    this.expect('accepted');
    this.snapshot.state = 'abandoned';
    this.snapshot.reason = reason?.trim() || null;
  }

  private addVersion(text: DecisionText, at: Date, note: string): void {
    this.snapshot.versions.push({ ...checkText(text), at, author: PERSON, note });
  }

  private expect(state: DecisionState): void {
    if (this.snapshot.state !== state)
      throw new DecisionError('decisionState', `DEC-${this.snapshot.id} is ${this.snapshot.state}, not ${state}`);
  }
}

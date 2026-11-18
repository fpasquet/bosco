/** Décisions, instructions des groupes et contexte transmis aux agents. */
export type DecisionStateDto = 'abandoned' | 'accepted' | 'proposed' | 'refused' | 'replaced';

/** Une décision porte sur un projet ; ce qui vaut pour plusieurs projets s'écrit dans un groupe. */
export interface DecisionTargetDto {
  kind: 'project';
  name: string;
}

export interface DecisionTextDto {
  alternatives: null | string;
  consequences: null | string;
  context: string;
  decision: string;
  title: string;
}

export interface DecisionVersionDto extends DecisionTextDto {
  at: string;
  author: string;
  note: string;
}

export interface DecisionDto {
  fromTask: null | number;
  id: number;
  reason: null | string;
  replacedBy: null | number;
  specifies: number[];
  state: DecisionStateDto;
  target: DecisionTargetDto;
  versions: DecisionVersionDto[];
}

export interface ArchitectureDto {
  calledBy: string[];
  calls: string[];
}

/** Instructions d'un groupe du projet ; system : « Tous les projets ». */
export interface GroupInstructionsDto {
  id: number;
  instructions: string;
  name: string;
  system: boolean;
}

/** Contexte d'un projet : ce qui est transmis, dans l'ordre, et ce qui attend ta validation. */
export interface ContextDto {
  architecture: ArchitectureDto;
  /** Décisions acceptées du projet, qui l'emportent sur les instructions */
  decisions: DecisionDto[];
  /** « Tous les projets » d'abord, puis chacun des groupes du projet */
  groups: GroupInstructionsDto[];
  proposed: DecisionDto[];
  project: string;
}

export interface ContextPreviewDto {
  absent: { proposed: DecisionDto[] };
  at: string;
  text: string;
  tokens: number;
}

export interface DecisionDetailDto {
  decision: DecisionDto;
  replacedBy: DecisionDto | null;
  specifiedBy: DecisionDto[];
}

/** Décisions, socles et contexte transmis aux agents (lot 3, E9, E14). */
export type DecisionStateDto = 'abandoned' | 'accepted' | 'proposed' | 'refused' | 'replaced';

export type DecisionTargetDto = { id: number; kind: 'socle' } | { kind: 'repository'; name: string };

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
  exceptionTo: null | number;
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

export interface SocleDto {
  applied: string[];
  decisions: DecisionDto[];
  exceptions: { decision: DecisionDto; replaces: DecisionDto; repository: string }[];
  id: number;
  inherits: null | number;
  name: string;
  repositories: string[];
  scope: 'global' | 'shared';
}

/** Contexte d'un dépôt (E9a) : ce qui est transmis, ce qui attend ta validation, ce qui est écarté. */
export interface ContextDto {
  architecture: ArchitectureDto;
  decisions: DecisionDto[];
  excluded: DecisionDto[];
  proposed: DecisionDto[];
  repository: string;
  socles: { decisions: DecisionDto[]; socle: { id: number; name: string; scope: 'global' | 'shared' } }[];
}

export interface ContextPreviewDto {
  absent: { excluded: DecisionDto[]; proposed: DecisionDto[] };
  at: string;
  text: string;
  tokens: number;
}

export interface DecisionDetailDto {
  decision: DecisionDto;
  replacedBy: DecisionDto | null;
  specifiedBy: DecisionDto[];
}

export type LinkServiceDto = 'confluence' | 'decision' | 'github' | 'jira' | 'page';

/** Lien d'une tâche (E10b) : ce que Bosco en a lu, et la cause d'une lecture en échec (« Non rafraîchi »). */
export interface LinkDto {
  error: null | string;
  id: number;
  kind: string;
  person: null | string;
  readAt: null | string;
  service: LinkServiceDto;
  state: null | string;
  taskId: number;
  title: string;
  url: string;
}

export interface IntegrationDto {
  address: null | string;
  checkedAt: null | string;
  error: null | string;
  failingSince: null | string;
  links: number;
  name: 'confluence' | 'github' | 'jira';
  state: 'connected' | 'error' | 'unconfigured';
}

export interface IntegrationsDto {
  integrations: IntegrationDto[];
  lastRefresh: null | string;
  nextRefresh: null | string;
}

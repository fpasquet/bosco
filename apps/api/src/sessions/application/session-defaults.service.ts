import type { SourceSnapshot } from '../domain/source.ts';
import type { PilotProfiles } from './pilot.service.ts';
import type {
  CatalogGroup,
  CatalogProject,
  ClaudeProfileDefaults,
  ProfileDefaultsRepository,
  SourceRepository,
} from './ports.ts';
import type { SessionService } from './session.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  changedDefaults,
  NO_DEFAULTS,
  type SessionDefaults,
  type SessionDefaultsChanges,
} from '../../shared/domain/session-settings.ts';
import { type Resolved, type ResolvedSettings, resolveProfile, resolveSettings } from '../domain/session-defaults.ts';

export class UnknownProfile extends DomainError {
  constructor(sourceId: string) {
    super('unknownProfile', `No watched profile ${sourceId}`);
  }
}

/** Ce qui décide des valeurs d'une nouvelle session : ses choix, son groupe, son projet principal, son profil. */
export interface DefaultsRequest {
  /** Réglages choisis pour la session ; null : selon les niveaux */
  chosen?: SessionDefaults;
  group: null | number;
  profile: null | string;
  /** Projet principal (sa racine) ; null avec un groupe : son projet principal */
  project: null | string;
  sandboxed: boolean;
}

export interface ResolvedDefaults extends ResolvedSettings {
  profile: Resolved<null | string>;
}

/** Réglages d'un profil (E4g) : ses valeurs dans Bosco, celles de Claude Code, son compte et ce qui l'utilise. */
export interface ProfileSettingsView {
  account: null | string;
  claude: SessionDefaults;
  defaults: SessionDefaults;
  isDefault: boolean;
  source: SourceSnapshot;
  usedBy: { groups: { id: number; name: string }[]; openSessions: number };
}

const NO_PROFILES: PilotProfiles = { subscriptions: () => Promise.resolve({ choices: [], effective: null }) };

/**
 * Valeurs par défaut des sessions (règle 16, DT-44) : résolues au démarrage par le domaine, du choix de la session au
 * profil Claude Code, avec l'origine de chacune ; les réglages d'un profil se gardent dans Bosco, jamais dans le
 * profil.
 */
export class SessionDefaultsService {
  private profiles: PilotProfiles = NO_PROFILES;

  constructor(
    private readonly sources: Pick<SourceRepository, 'list'>,
    private readonly repository: ProfileDefaultsRepository,
    private readonly claude: ClaudeProfileDefaults,
    private readonly sessions: Pick<SessionService, 'knownGroups' | 'knownProjects' | 'listSessions'>,
  ) {}

  /** Abonnements Claude et profil par défaut (E11c), branchés au démarrage. */
  useProfiles(profiles: PilotProfiles): void {
    this.profiles = profiles;
  }

  /** Profil, mode, modèle et effort d'une nouvelle session, chacun avec son origine (CA-SESS-156, CA-SESS-157). */
  async resolveDefaults(request: DefaultsRequest): Promise<ResolvedDefaults> {
    const [projects, groups, sources, accounts] = await Promise.all([
      this.sessions.knownProjects(),
      this.sessions.knownGroups(),
      this.sources.list(),
      this.profiles.subscriptions(),
    ]);
    const group = groups.find(({ id }) => id === request.group) ?? null;
    const project = this.projectOf(request.project, group, projects);
    const watched = new Set(sources.filter((source) => source.watched).map(({ path }) => path));
    const profile = resolveProfile({
      available: accounts.choices.map(({ path }) => path).filter((path) => watched.has(path)),
      chosen: request.profile,
      defaultProfile: accounts.effective,
      group: group && { name: group.name, profile: group.defaults.profile },
      project: project && { name: project.name, profile: project.defaults.profile },
    });
    const source = sources.find(({ path }) => path === profile.value) ?? null;
    const [own, claude] = await Promise.all([
      source ? this.repository.find(source.id) : Promise.resolve(NO_DEFAULTS),
      profile.value ? this.claude.sessionDefaults(profile.value) : Promise.resolve(NO_DEFAULTS),
    ]);
    const settings = resolveSettings({
      chosen: request.chosen ?? NO_DEFAULTS,
      claude,
      group: group && { name: group.name, defaults: group.defaults },
      project: project && { name: project.name, defaults: project.defaults },
      profile: source && { name: source.label, defaults: own },
      sandboxed: request.sandboxed,
    });
    return { ...settings, profile };
  }

  /** Page d'un profil (E4g, CA-REGL-17) : ses réglages dans Bosco, ceux du profil Claude Code et ce qui l'utilise. */
  async getProfileSettings(sourceId: string): Promise<ProfileSettingsView> {
    const sources = await this.sources.list();
    const source = sources.find(({ id }) => id === sourceId);
    if (!source) throw new UnknownProfile(sourceId);
    const [defaults, claude, accounts, groups, sessions] = await Promise.all([
      this.repository.find(source.id),
      this.claude.sessionDefaults(source.path),
      this.profiles.subscriptions(),
      this.sessions.knownGroups(),
      this.sessions.listSessions(),
    ]);
    return {
      account: accounts.choices.find(({ path }) => path === source.path)?.account ?? null,
      claude,
      defaults,
      isDefault: accounts.effective === source.path,
      source: source.toSnapshot(),
      usedBy: {
        groups: groups.filter(({ defaults }) => defaults.profile === source.path).map(({ id, name }) => ({ id, name })),
        openSessions: sessions.filter((session) => session.sourceId === source.id && session.state !== 'ended').length,
      },
    };
  }

  /**
   * « Enregistrer » les réglages d'un profil (CA-REGL-19, CA-REGL-21) : gardés par Bosco, sans toucher aux fichiers du
   * profil ; ils valent pour les sessions suivantes.
   */
  async changeProfileDefaults(sourceId: string, changes: SessionDefaultsChanges): Promise<ProfileSettingsView> {
    const sources = await this.sources.list();
    if (!sources.some(({ id }) => id === sourceId)) throw new UnknownProfile(sourceId);
    const current = await this.repository.find(sourceId);
    await this.repository.save(sourceId, changedDefaults(current, changes));
    return this.getProfileSettings(sourceId);
  }

  /** Projet principal : celui demandé, sinon le premier du groupe. */
  private projectOf(
    root: null | string,
    group: CatalogGroup | null,
    projects: readonly CatalogProject[],
  ): CatalogProject | null {
    if (root) return projects.find((candidate) => candidate.root === root) ?? null;
    const principal = group?.projects[0];
    return projects.find(({ id }) => id === principal) ?? null;
  }
}

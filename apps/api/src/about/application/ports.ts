import type { PublishedRelease, UpdateChannel } from '../domain/release.ts';

export interface Clock {
  now(): Date;
}

export type InstallKind = 'appimage' | 'deb' | 'source';

/** Ce que Bosco sait de sa construction : la version, le commit, et s'il s'agit d'une release. */
export interface BuildInfo {
  version: string;
  commit: null | string;
  release: boolean;
  install: InstallKind;
}

export interface BuildInfoSource {
  current(): BuildInfo;
}

/** Les releases publiées sur GitHub : un appel en lecture, sans identifiant. */
export interface ReleaseFeed {
  list(): Promise<PublishedRelease[]>;
}

/** Le journal des versions embarqué avec Bosco (CHANGELOG.md). */
export interface ChangelogSource {
  read(): Promise<string>;
}

/** Ce que Bosco garde des mises à jour, dans les réglages du poste. */
export interface UpdateState {
  enabled: boolean;
  /** Canal choisi ; null : celui de la version qui tourne */
  channel: null | UpdateChannel;
  checkedAt: Date | null;
  latest: null | PublishedRelease;
  error: null | string;
  /** Version au lancement précédent : une autre au lancement suivant, c'est une mise à jour */
  lastRunVersion: null | string;
  /** Version installée à annoncer une fois (« Bosco X installé »), jusqu'à ce que le bandeau se ferme */
  installedNotice: null | string;
  /** Version disponible dont l'avis a été fermé */
  dismissed: null | string;
}

export interface UpdateStore {
  load(): Promise<UpdateState>;
  save(state: UpdateState): Promise<void>;
}

/** Dossier de configuration de Claude Code (un profil) proposé ou surveillé par Bosco (RF-SESS-01). */
export interface SourceSnapshot {
  id: string;
  label: string;
  liveTracking: boolean;
  path: string;
  watched: boolean;
}

export class Source {
  private constructor(private snapshot: SourceSnapshot) {}

  get id(): string {
    return this.snapshot.id;
  }

  get path(): string {
    return this.snapshot.path;
  }

  /** Nom court du profil (« perso ») */
  get label(): string {
    return this.snapshot.label;
  }

  get watched(): boolean {
    return this.snapshot.watched;
  }

  get liveTracking(): boolean {
    return this.snapshot.liveTracking;
  }

  /** Le suivi en direct est installé dans le profil : T'attend et les autorisations deviennent possibles (RF-SESS-03). */
  enableLiveTracking(): void {
    this.snapshot = { ...this.snapshot, liveTracking: true };
  }

  /** Interrupteur de la source (E4a) : la lecture s'arrête ou reprend, rien n'est effacé (CA-SESS-56). */
  setWatched(watched: boolean): void {
    this.snapshot = { ...this.snapshot, watched };
  }

  disableLiveTracking(): void {
    this.snapshot = { ...this.snapshot, liveTracking: false };
  }

  /** Un profil retenu au premier lancement, ou laissé de côté : il garde sa place pour être activé plus tard. */
  static choose(id: string, path: string, watched: boolean): Source {
    return new Source({ id, path, label: labelOf(path), watched, liveTracking: false });
  }

  static restore(snapshot: SourceSnapshot): Source {
    return new Source({ ...snapshot });
  }

  toSnapshot(): SourceSnapshot {
    return { ...this.snapshot };
  }
}

/** Nom court d'un profil d'après son dossier : ~/.claude-perso → « perso », ~/.claude → « claude ». */
export function labelOf(path: string): string {
  const folder = path.split('/').filter(Boolean).pop() ?? path;
  const match = /^\.?claude-(.+)$/.exec(folder);
  return match?.[1] ?? folder.replace(/^\./, '');
}

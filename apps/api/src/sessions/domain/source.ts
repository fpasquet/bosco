import { DomainError } from '../../shared/domain/domain-error.ts';

/** Dossier de configuration de Claude Code (un profil) proposé ou surveillé par Bosco (RF-SESS-01). */
export interface SourceSnapshot {
  id: string;
  label: string;
  liveTracking: boolean;
  /** Tenue par Bosco (le profil des bacs à sable) : toujours lue, sans suivi en direct ni canal à installer */
  managed: boolean;
  path: string;
  watched: boolean;
}

/** Bosco tient seul le profil des bacs à sable : le couper ferait disparaître leurs sessions. */
export class ManagedSource extends DomainError {
  constructor(path: string) {
    super('managedSource', `The source ${path} is kept by Bosco`);
  }
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

  get managed(): boolean {
    return this.snapshot.managed;
  }

  /** Le suivi en direct est installé dans le profil : T'attend et les autorisations deviennent possibles (RF-SESS-03). */
  enableLiveTracking(): void {
    if (this.managed) throw new ManagedSource(this.path);
    this.snapshot = { ...this.snapshot, liveTracking: true };
  }

  /** Interrupteur de la source (E4a) : la lecture s'arrête ou reprend, rien n'est effacé (CA-SESS-56). */
  setWatched(watched: boolean): void {
    if (this.managed && !watched) throw new ManagedSource(this.path);
    this.snapshot = { ...this.snapshot, watched };
  }

  disableLiveTracking(): void {
    this.snapshot = { ...this.snapshot, liveTracking: false };
  }

  /** Un profil retenu au premier lancement, ou laissé de côté : il garde sa place pour être activé plus tard. */
  static choose(id: string, path: string, watched: boolean): Source {
    return new Source({ id, path, label: labelOf(path), watched, liveTracking: false, managed: false });
  }

  /** Le profil des bacs à sable, ajouté par Bosco au premier bac à sable : toujours lu, sous le nom « Bacs à sable ». */
  static manage(id: string, path: string): Source {
    return new Source({ id, path, label: 'Bacs à sable', watched: true, liveTracking: false, managed: true });
  }

  /** Un profil des bacs à sable lu avant que Bosco le tienne à part : il le reprend, sans changer son identifiant. */
  takeOver(): void {
    this.snapshot = { ...this.snapshot, label: 'Bacs à sable', watched: true, liveTracking: false, managed: true };
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

/** Jetons d'injection des adaptateurs, partagés par les modules d'assemblage. */
export const CONFIG = Symbol('Config');
export const ORM = Symbol('MikroORM');
export const SESSION_SERVICE = Symbol('SessionService');
export const SOURCE_SERVICE = Symbol('SourceService');
export const TRANSCRIPT_WATCHER = Symbol('TranscriptWatcher');

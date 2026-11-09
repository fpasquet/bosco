// Garde-fou des mises à jour (CA-APPS-10) : le service du dépôt et celui de l'application du poste partagent la base du
// poste. Un Bosco plus ancien ne démarre pas sur une base qu'un Bosco plus récent a migrée : il ne connaît pas son schéma.

/** Les migrations passées sur la base que ce Bosco ne connaît pas, celles d'un Bosco plus récent. */
export function newerMigrations(executed: readonly string[], known: readonly string[]): string[] {
  const names = new Set(known);
  return executed.map((name) => name.replace(/\.[jt]s$/, '')).filter((name) => !names.has(name));
}

export class DatabaseTooNewError extends Error {
  constructor(file: string, migrations: readonly string[]) {
    super(
      `The database ${file} was migrated by a newer Bosco (${migrations.join(', ')}): ` +
        'start that newer Bosco, or update this one.',
    );
    this.name = 'DatabaseTooNewError';
  }
}

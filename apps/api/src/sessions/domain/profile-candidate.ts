/** Aperçu d'un dossier de configuration trouvé sur le poste, sans lire aucune session (CA-SESS-02). */
export interface ProfileCandidate {
  lastSessionAt: Date | null;
  path: string;
  repositoryCount: number;
}

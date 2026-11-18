/** Aperçu d'un dossier de configuration trouvé sur le poste, sans lire aucune session. */
export interface ProfileCandidate {
  lastSessionAt: Date | null;
  path: string;
  projectCount: number;
}

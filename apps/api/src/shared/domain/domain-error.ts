/** Erreur du domaine : un code stable, traduit par l'interface, et un message en anglais pour les journaux. */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

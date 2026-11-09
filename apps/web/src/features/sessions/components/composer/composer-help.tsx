export interface ComposerHelpProps {
  className?: string;
  id: string;
}

/** Raccourcis de l'éditeur, sous la zone de message. */
export function ComposerHelp({ className, id }: ComposerHelpProps) {
  return (
    <p id={id} className={className}>
      <kbd className="kbd kbd-xs">Entrée</kbd> pour envoyer · <kbd className="kbd kbd-xs">Maj</kbd>+
      <kbd className="kbd kbd-xs">Entrée</kbd> pour une ligne · <kbd className="kbd kbd-xs">@</kbd> un fichier ·{' '}
      <kbd className="kbd kbd-xs">/</kbd> une commande
    </p>
  );
}

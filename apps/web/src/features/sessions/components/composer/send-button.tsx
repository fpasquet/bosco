import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SendMode = 'labeled' | 'send' | 'stop';

export interface SendButtonProps {
  /** Envoi en cours : le bouton montre un indicateur de chargement */
  busy: boolean;
  className?: string;
  disabled: boolean;
  /** Texte du bouton libellé (« Démarrer ») */
  label?: string;
  mode: SendMode;
  onSend: () => void;
  onStop: () => void;
}

const CIRCLE_CLASS = 'btn btn-circle btn-sm max-md:size-9';

/** Bouton d'envoi de la zone de message : flèche ronde, bouton libellé, ou « Arrêter » pendant un tour. */
export function SendButton({ busy, className, disabled, label, mode, onSend, onStop }: SendButtonProps) {
  if (mode === 'stop')
    return (
      <button
        type="button"
        aria-label="Arrêter"
        disabled={disabled}
        className={cn(CIRCLE_CLASS, 'btn-outline', className)}
        onClick={onStop}
      >
        <Square aria-hidden className="size-3.5 fill-current" />
      </button>
    );
  const icon = busy ? (
    <span aria-hidden className="loading loading-xs loading-spinner" />
  ) : (
    <ArrowUp aria-hidden className="size-4" />
  );
  if (mode === 'labeled')
    return (
      <button
        type="button"
        aria-busy={busy}
        disabled={disabled}
        className={cn('btn whitespace-nowrap btn-primary btn-sm', className)}
        onClick={onSend}
      >
        {icon}
        {label}
      </button>
    );
  return (
    <button
      type="button"
      aria-label="Envoyer"
      aria-busy={busy}
      disabled={disabled}
      className={cn(CIRCLE_CLASS, 'btn-primary', className)}
      onClick={onSend}
    >
      {icon}
    </button>
  );
}

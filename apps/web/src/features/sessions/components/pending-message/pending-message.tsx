import { Clock } from 'lucide-react';

export interface PendingMessageProps {
  busy: boolean;
  images: number;
  onCancel: () => void;
  text: string;
}

/** Message en attente sous le fil (E2e, CA-SESS-93) : il partira à la fin du tour, sauf s'il est annulé. */
export function PendingMessage({ busy, images, onCancel, text }: PendingMessageProps) {
  return (
    <div className="mt-4 flex flex-col items-end gap-1">
      <p className="text-xs font-medium text-muted">Toi · en attente</p>
      <p className="max-w-4/5 rounded-card border border-dashed border-primary bg-primary-soft px-3 py-2 whitespace-pre-wrap">
        {text}
        {images > 0 && (
          <span className="mt-1 block text-xs text-muted">
            {images} image{images > 1 ? 's' : ''} jointe{images > 1 ? 's' : ''}
          </span>
        )}
      </p>
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <Clock aria-hidden className="size-3.5" />
        partira à la fin du tour ·
        <button type="button" className="link link-primary" disabled={busy} onClick={onCancel}>
          Annuler
        </button>
      </p>
    </div>
  );
}

'use client';
import { Copy, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';
import type { PairingCodeDto } from '../../api/access';
import { pairingLink } from '../../lib/pairing';

export interface PairingDialogProps {
  code: null | PairingCodeDto;
  /** Empreinte du certificat, ajoutée au QR code pour l'application Android */
  fingerprint?: null | string;
  now: Date;
  onCancel: () => void;
  onCopy: (text: string, label: string) => void;
  onNewCode: () => void;
  open: boolean;
  url: null | string;
}

/** « 482 913 » */
function spaced(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

function remaining(expiresAt: string, now: Date): string {
  const seconds = Math.max(0, Math.round((new Date(expiresAt).getTime() - now.getTime()) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Appairage d'un téléphone (E4c) : l'adresse sur le réseau local, l'avertissement du certificat à accepter une fois,
 * et un code valable 5 minutes, à usage unique, avec 5 essais au plus (CA-SESS-66).
 */
export function PairingDialog({
  code,
  fingerprint = null,
  now,
  onCancel,
  onCopy,
  onNewCode,
  open,
  url,
}: PairingDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  // Le code tant qu'il vaut : le QR code et l'affichage n'en montrent pas d'expiré
  const current = code && new Date(code.expiresAt) > now ? code : null;
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="pairing-title" onClose={onCancel}>
      <div className="modal-box flex flex-col gap-4">
        <div>
          <h2 id="pairing-title" className="font-display text-lg font-semibold">
            Accès depuis le téléphone
          </h2>
          <p className="text-xs text-muted">Le téléphone se connecte sur le même réseau.</p>
        </div>
        <ol className="flex flex-col gap-4">
          <li className="flex flex-col gap-2">
            <p className="font-medium">1. Sur le téléphone, connecté au même réseau, scanne ce QR code</p>
            {url && (
              <div className="flex items-center gap-4">
                <QRCodeSVG
                  value={pairingLink(url, current?.code ?? null, fingerprint)}
                  size={144}
                  marginSize={2}
                  level="M"
                  bgColor="transparent"
                  fgColor="currentColor"
                  role="img"
                  aria-label="QR code de l’adresse du poste et du code d’appairage"
                  className="shrink-0 rounded-control border border-line bg-surface p-1 text-ink"
                />
                <p className="text-xs text-muted">
                  L’appareil photo ouvre {APP_NAME} avec le code déjà rempli : le téléphone s’appaire seul.
                </p>
              </div>
            )}
            <p className="text-xs text-muted">Ou ouvre cette adresse :</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-control bg-surface-alt px-3 py-2 font-mono text-sm">
                {url ?? '…'}
              </code>
              {url && (
                <Button variant="outline" size="sm" onClick={() => onCopy(url, 'Adresse copiée')}>
                  <Copy aria-hidden className="size-3.5" />
                  Copier
                </Button>
              )}
            </div>
          </li>
          <li>
            <p className="font-medium">2. Accepte l’avertissement du navigateur</p>
            <p className="text-xs text-muted">
              Une seule fois : le certificat est créé par {APP_NAME}, le navigateur demande de le confirmer.
            </p>
          </li>
          <li className="flex flex-col gap-1">
            <p className="font-medium">3. Saisis ce code, s’il n’est pas déjà rempli</p>
            <p aria-live="polite" className="font-mono text-3xl font-semibold tracking-widest tabular-nums">
              {current ? spaced(current.code) : '—'}
            </p>
            <p className="text-xs text-muted">
              {current
                ? `Valable encore ${remaining(current.expiresAt, now)} · à usage unique`
                : 'Code expiré : génère un nouveau code.'}
            </p>
          </li>
        </ol>
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="loading loading-sm loading-dots" aria-hidden />
          En attente du téléphone…
        </p>
        <div className="modal-action mt-0">
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="outline" onClick={onNewCode}>
            <RefreshCw aria-hidden className="size-3.5" />
            Générer un nouveau code
          </Button>
        </div>
      </div>
    </dialog>
  );
}

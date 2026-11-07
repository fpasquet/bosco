'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';
import { APP_NAME } from '@bosco/domain';
import { claimPairingCode } from '../../api/access';

const MESSAGES = {
  expired: 'Ce code a expiré, a déjà servi ou n’a plus d’essai : génère un nouveau code sur le poste.',
  wrong: 'Code incorrect : vérifie les 6 chiffres affichés sur le poste.',
} as const;

/** Sur le téléphone, un écran plein ne demande que le code affiché sur le poste (E4c). */
export function PairingScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof MESSAGES | null>(null);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas p-6 text-ink">
      <Logo size="lg" />
      <div className="text-center">
        <h1 className="font-display text-xl font-semibold">Appairer ce téléphone</h1>
        <p className="mt-1 text-muted">Saisis le code affiché sur le poste, dans {APP_NAME} › Sources.</p>
      </div>
      <form
        className="flex w-full max-w-xs flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          void claimPairingCode(code).then((result) => {
            setBusy(false);
            if (result === 'accepted') router.push('/');
            else setError(result);
          });
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Code à 6 chiffres</span>
          <input
            className="input w-full text-center font-mono tracking-widest input-lg"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? 'pairing-error' : undefined}
          />
        </label>
        {error && (
          <p id="pairing-error" role="alert" className="text-sm text-danger">
            {MESSAGES[error]}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy || code.replaceAll(/\s/g, '').length !== 6}>
          Appairer
        </Button>
      </form>
    </main>
  );
}

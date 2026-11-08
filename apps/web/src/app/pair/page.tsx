import { Suspense } from 'react';
import { PairingScreen } from '@/features/sessions/components/pairing-screen';

/**
 * Page ouverte par le téléphone avant son appairage (E4c) : la seule accessible sans jeton (NF-14). Elle lit le code
 * de son adresse quand le QR code l'a ouverte.
 */
export default function PairPage() {
  return (
    <Suspense>
      <PairingScreen />
    </Suspense>
  );
}

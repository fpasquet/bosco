import { Suspense } from 'react';
import { PairingScreen } from '@/features/sessions/components/pairing-screen';

/**
 * Page ouverte par le téléphone avant son appairage : la seule accessible sans jeton. Elle lit le code
 * de son adresse quand le QR code l'a ouverte.
 */
export default function PairPage() {
  return (
    <Suspense>
      <PairingScreen />
    </Suspense>
  );
}

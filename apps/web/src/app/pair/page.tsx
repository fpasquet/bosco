import { PairingScreen } from '@/features/sessions/components/pairing-screen';

/** Page ouverte par le téléphone avant son appairage (E4c) : la seule accessible sans jeton (NF-14). */
export default function PairPage() {
  return <PairingScreen />;
}

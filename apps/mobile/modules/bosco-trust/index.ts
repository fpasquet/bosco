// Empreinte du certificat du poste, gardée côté Android pour la vue web.
import { requireNativeModule } from 'expo';

interface BoscoTrust {
  certificate(): null | string;
  setCertificate(fingerprint: null | string): void;
  /** Service au premier plan qui garde l'application connectée en arrière-plan */
  setKeepAlive(enabled: boolean): void;
}

export const boscoTrust = requireNativeModule<BoscoTrust>('BoscoTrust');

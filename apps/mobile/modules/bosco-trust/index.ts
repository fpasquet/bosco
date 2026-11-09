// Empreinte du certificat du poste, gardée côté Android pour la vue web (CA-APPS-05).
import { requireNativeModule } from 'expo';

interface BoscoTrust {
  certificate(): null | string;
  setCertificate(fingerprint: null | string): void;
  /** Service au premier plan qui garde l'application connectée en arrière-plan (E18d) */
  setKeepAlive(enabled: boolean): void;
}

export const boscoTrust = requireNativeModule<BoscoTrust>('BoscoTrust');

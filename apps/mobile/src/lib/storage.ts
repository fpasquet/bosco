// Poste appairé, gardé dans le trousseau du téléphone ; l'empreinte va aussi à la vue web (BoscoTrust).
import * as SecureStore from 'expo-secure-store';
import { boscoTrust } from '../../modules/bosco-trust';
import { type AppPreferences, readPreferences } from './preferences';

export interface Workstation {
  fingerprint: string;
  pairedAt: string;
  url: string;
}

const WORKSTATION = 'bosco.workstation';
const PREFERENCES = 'bosco.preferences';

export async function loadWorkstation(): Promise<null | Workstation> {
  const stored = await SecureStore.getItemAsync(WORKSTATION);
  return stored ? (JSON.parse(stored) as Workstation) : null;
}

export async function saveWorkstation(workstation: null | Workstation): Promise<void> {
  boscoTrust.setCertificate(workstation?.fingerprint ?? null);
  if (workstation) await SecureStore.setItemAsync(WORKSTATION, JSON.stringify(workstation));
  else await SecureStore.deleteItemAsync(WORKSTATION);
}

export async function loadPreferences(): Promise<AppPreferences> {
  const stored = await SecureStore.getItemAsync(PREFERENCES);
  return readPreferences(stored);
}

export async function savePreferences(preferences: AppPreferences): Promise<void> {
  await SecureStore.setItemAsync(PREFERENCES, JSON.stringify(preferences));
}

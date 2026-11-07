import type { DeviceSnapshot } from '../domain/device.ts';

export interface DeviceRepository {
  findByTokenHash(tokenHash: string): Promise<DeviceSnapshot | null>;
  list(): Promise<DeviceSnapshot[]>;
  remove(id: string): Promise<void>;
  save(device: DeviceSnapshot): Promise<void>;
}

/** Écoute HTTPS sur le réseau local, ouverte seulement quand l'accès du téléphone est activé (NF-13). */
export interface PhoneListener {
  start(): Promise<{ urls: string[] }>;
  stop(): Promise<void>;
  urls(): string[];
}

/** Jetons et codes aléatoires, et empreinte d'un jeton : seule l'empreinte est enregistrée. */
export interface Secrets {
  code(): string;
  hash(token: string): string;
  id(): string;
  token(): string;
}

/** Réglage persistant de l'accès du téléphone : il se rouvre au démarrage s'il était activé. */
export interface AccessSettings {
  load(): Promise<boolean>;
  save(enabled: boolean): Promise<void>;
}

export interface Clock {
  now(): Date;
}

import type { DeviceSnapshot } from '../domain/device.ts';
import type { AccessSettings, Clock, DeviceRepository, PhoneListener, Secrets } from './ports.ts';
import { type ClaimResult, PairingCode } from '../domain/pairing-code.ts';

export interface AccessStatus {
  enabled: boolean;
  /** Empreinte du certificat du téléphone (« 9F:3A:… ») : l'application Android ne fait confiance qu'à lui */
  fingerprint: null | string;
  /** Adresses à ouvrir sur le téléphone, sur le réseau local */
  urls: string[];
}

export interface Claim {
  device: DeviceSnapshot | null;
  result: ClaimResult;
  /** Jeton remis au téléphone, à présenter à chaque requête ; jamais enregistré en clair */
  token: null | string;
}

/** Cas d'usage de l'accès depuis le téléphone (E4c, RF-SESS-07) : activation, appairage par code, retrait. */
export class AccessService {
  private code: null | PairingCode = null;

  constructor(
    private readonly devices: DeviceRepository,
    private readonly listener: PhoneListener,
    private readonly settings: AccessSettings,
    private readonly secrets: Secrets,
    private readonly clock: Clock,
  ) {}

  async status(): Promise<AccessStatus> {
    const enabled = await this.settings.load();
    return {
      enabled,
      fingerprint: enabled ? this.listener.fingerprint() : null,
      urls: enabled ? this.listener.urls() : [],
    };
  }

  /** Au démarrage : l'écoute du réseau local ne se rouvre que si l'accès était activé (NF-13). */
  async resume(): Promise<void> {
    if (await this.settings.load()) await this.listener.start();
  }

  async enable(): Promise<AccessStatus> {
    const { urls } = await this.listener.start();
    await this.settings.save(true);
    return { enabled: true, fingerprint: this.listener.fingerprint(), urls };
  }

  async disable(): Promise<AccessStatus> {
    await this.listener.stop();
    await this.settings.save(false);
    this.code = null;
    return { enabled: false, fingerprint: null, urls: [] };
  }

  /** Nouveau code : il invalide le précédent (CA-SESS-67). */
  issueCode(): { code: string; expiresAt: Date } {
    this.code = PairingCode.issue(this.secrets.code(), this.clock.now());
    return { code: this.code.value, expiresAt: this.code.expiresAt };
  }

  async claim(candidate: string, deviceName: string): Promise<Claim> {
    const result = this.code?.claim(candidate, this.clock.now()) ?? 'expired';
    if (result !== 'accepted') return { result, device: null, token: null };
    this.code = null;
    const token = this.secrets.token();
    const device = {
      id: this.secrets.id(),
      name: deviceName,
      pairedAt: this.clock.now(),
      tokenHash: this.secrets.hash(token),
    };
    await this.devices.save(device);
    return { result, device, token };
  }

  listDevices(): Promise<DeviceSnapshot[]> {
    return this.devices.list();
  }

  /** Retirer un téléphone coupe son accès aussitôt (CA-SESS-68). */
  revoke(id: string): Promise<void> {
    return this.devices.remove(id);
  }

  async authorize(token: null | string): Promise<boolean> {
    if (!token) return false;
    return (await this.devices.findByTokenHash(this.secrets.hash(token))) !== null;
  }
}

/** Accès depuis le téléphone (E4c). */
export interface PhoneAccessDto {
  enabled: boolean;
  urls: string[];
}

export interface DeviceDto {
  id: string;
  name: string;
  pairedAt: string;
}

export interface PairingCodeDto {
  attempts: number;
  code: string;
  expiresAt: string;
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export const phoneAccessQuery = {
  queryKey: ['phone-access'],
  queryFn: () => send<PhoneAccessDto>('/api/phone-access', 'GET'),
};

export const devicesQuery = {
  queryKey: ['devices'],
  queryFn: async () => (await send<{ devices: DeviceDto[] }>('/api/devices', 'GET')).devices,
};

export const setPhoneAccess = (enabled: boolean) => send<PhoneAccessDto>('/api/phone-access', 'PUT', { enabled });

export const issuePairingCode = () => send<PairingCodeDto>('/api/pairing/code', 'POST');

export const revokeDevice = (id: string) => send<void>(`/api/devices/${encodeURIComponent(id)}`, 'DELETE');

/** Code saisi sur le téléphone : accepté, refusé (encore des essais), ou expiré, déjà servi, épuisé. */
export async function claimPairingCode(code: string): Promise<'accepted' | 'expired' | 'wrong'> {
  const response = await fetch('/api/pairing/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (response.ok) return 'accepted';
  return response.status === 400 ? 'wrong' : 'expired';
}

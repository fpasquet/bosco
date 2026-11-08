import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import type { Secrets } from '../../application/ports.ts';

export const cryptoSecrets: Secrets = {
  code: () => String(randomInt(0, 1_000_000)).padStart(6, '0'),
  hash: (token) => createHash('sha256').update(token).digest('hex'),
  id: () => randomUUID(),
  token: () => randomBytes(32).toString('base64url'),
};

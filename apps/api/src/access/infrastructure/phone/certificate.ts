// Certificat du téléphone (DT-10), créé par Bosco avec openssl : les échanges sont chiffrés, et le navigateur demande
// une fois de l'accepter. Il est refait quand l'adresse du poste sur le réseau change.
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const OPENSSL = '/usr/bin/openssl';
const run = promisify(execFile);

export interface Certificate {
  cert: Buffer;
  key: Buffer;
}

export async function certificateFor(dataDir: string, hosts: string[]): Promise<Certificate> {
  const dir = join(dataDir, 'phone');
  const files = { cert: join(dir, 'cert.pem'), hosts: join(dir, 'hosts.json'), key: join(dir, 'key.pem') };
  const wanted = JSON.stringify([...hosts].toSorted((a, b) => a.localeCompare(b)));
  const current = existsSync(files.hosts) ? readFileSync(files.hosts, 'utf8') : '';
  if (!existsSync(files.cert) || current !== wanted) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const names = hosts.map((host) => (/^[\d.]+$/.test(host) ? `IP:${host}` : `DNS:${host}`)).join(',');
    await run(OPENSSL, [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-days',
      '825',
      '-subj',
      '/CN=Bosco',
      '-addext',
      `subjectAltName=${names}`,
      '-keyout',
      files.key,
      '-out',
      files.cert,
    ]);
    writeFileSync(files.hosts, wanted);
  }
  return { cert: readFileSync(files.cert), key: readFileSync(files.key) };
}

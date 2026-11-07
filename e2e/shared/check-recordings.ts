// Recherche de secrets dans les enregistrements versionnés (lancé par lint et en CI) : node check-recordings.ts
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { findSecrets } from '../replay/replay.ts';

const dirs = ['api/recordings', 'web/recordings']
  .map((dir) => join(import.meta.dirname, '..', dir))
  .filter((dir) => existsSync(dir));
const found = dirs.flatMap((dir) => findSecrets(dir));
console.log(found.length ? found.join('\n') : `${dirs.length} recording folder(s), no secret`);
process.exit(found.length ? 1 : 0);

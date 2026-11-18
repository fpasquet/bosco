// Faux jeton longue durée des scénarios (`claude setup-token`), rangé dans le dossier temporaire du scénario : seuls ses
// 4 derniers caractères apparaissent dans les réponses du faux Claude Code.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const FAKE_TOKEN = 'sk-ant-oat01-fake-token-for-e2e-7f3a';

/** Écrit le faux jeton, ou un fichier vide, dans un dossier du dossier personnel du scénario. */
export function writeTokenFile(home: string, folder: string, file: string, content = `${FAKE_TOKEN}\n`): void {
  mkdirSync(join(home, folder), { recursive: true });
  writeFileSync(join(home, folder, file), content);
}

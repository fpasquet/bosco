// Mise en forme commune, code et scénarios Gherkin : "prettier": "@bosco/configs/prettier" dans le package.json racine.
// Le greffon est résolu depuis ce paquet, pour que la racine n'ait pas à le déclarer.
import { fileURLToPath } from 'node:url';

/** @type {import('prettier').Config} */
export default {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  plugins: [fileURLToPath(import.meta.resolve('prettier-plugin-gherkin'))],
};

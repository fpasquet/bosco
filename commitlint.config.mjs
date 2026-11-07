// Messages de commit en Conventional Commits (AGENTS.md), vérifiés par le hook commit-msg et par la CI.
/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Un sujet peut commencer par un nom propre ou un identifiant (GitHub, ESLint, APP_NAME), que la casse imposée refuse.
    'subject-case': [0],
  },
};

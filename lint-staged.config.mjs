// Formate les fichiers indexés avant chaque commit (hook pre-commit) ; le lint typé reste dans turbo run lint et la CI.
/** @type {import('lint-staged').Configuration} */
export default {
  '*': 'prettier --write --ignore-unknown',
};

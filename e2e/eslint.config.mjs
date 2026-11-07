import { base } from '@bosco/configs/eslint/base';

export default base({ tsconfigRootDir: import.meta.dirname, ignores: ['api/recordings/**', 'web/recordings/**'] });

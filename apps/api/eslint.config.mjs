import { nest } from '@bosco/configs/eslint/nest';

// Migrations générées par MikroORM, jamais modifiées une fois commitées : hors du lint.
export default nest({ tsconfigRootDir: import.meta.dirname, ignores: ['src/migrations/Migration*.ts'] });

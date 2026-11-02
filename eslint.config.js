import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'client/**'] }, // client has its own eslint config
  js.configs.recommended,
  {
    files: ['server/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
    rules: {
      'no-console': ['error', { allow: ['error'] }],       // use the logger; console.error only for fatal start-up problems
      'no-unused-vars': ['error', { argsIgnorePattern: '^(next|_)' }],
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['server/prisma/seed.js'],
    rules: { 'no-console': 'off' },
  },
];

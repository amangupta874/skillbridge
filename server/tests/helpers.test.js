import { expect, test } from 'vitest';
import { assertTestDatabase } from './helpers.js';

test('database reset refuses a database URL without test in its name', () => {
  expect(() => assertTestDatabase('postgresql://localhost/skillbridge_dev'))
    .toThrow('DATABASE_URL does not contain "test"');
});

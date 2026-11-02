import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,   // integration tests share one test database, so run files one after another
    testTimeout: 15000,
  },
});

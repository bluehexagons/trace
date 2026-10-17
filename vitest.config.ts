import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    maxWorkers: 2,
    reporters: ['dot'],
    include: ['src/__tests__/**/*.test.ts'],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    globals: true,
    maxConcurrency: 10,
    maxWorkers: 10,
    minWorkers: 10,
  },
})
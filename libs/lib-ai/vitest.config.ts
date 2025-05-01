import { defineConfig } from 'vitest/config';

// Base configuration shared between regular tests and evaluation tests
const baseConfig = {
  environment: 'node',
  globals: true,
  maxConcurrency: 10,
  maxWorkers: 10,
  minWorkers: 10,
  deps: {
    interopDefault: true
  },
  reporters: ['default'],
  outputFile: process.env.VITEST_OUTPUT_FILE ? {
    junit: process.env.VITEST_OUTPUT_FILE
  } : undefined,
};

// Default export for regular tests (.spec.ts and .test.ts)
export default defineConfig({
  test: {
    ...baseConfig,
    include: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    exclude: [
      '**/*.eval.[tj]s?(x)',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
  },
});

// Export for evaluation tests (.eval.ts)
export const evalConfig = defineConfig({
  test: {
    ...baseConfig,
    include: ['**/*.eval.[tj]s?(x)'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
  },
});

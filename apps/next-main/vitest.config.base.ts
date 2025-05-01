import path from "path";
import {defineConfig} from "vitest/config";

import react from "@vitejs/plugin-react";

export const baseConfig = {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    testTimeout: 10000,
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@/app': path.resolve(__dirname, './app'),
      '@/components': path.resolve(__dirname, './components'),
      '@/clientOnly': path.resolve(__dirname, './clientOnly'),
      '@/styles': path.resolve(__dirname, './styles'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/public': path.resolve(__dirname, './public'),
      '@reasonote/lib-api-sdk': path.resolve(__dirname, '../../libs/api-sdk'),
      '@reasonote/lib-sdk': path.resolve(__dirname, '../../libs/lib-sdk/src'),
      '@reasonote/lib-utils': path.resolve(__dirname, '../../libs/utils/src'),
      '@reasonote/lib-utils-frontend': path.resolve(__dirname, '../../libs/utils-frontend/src'),
      '@reasonote/lib-sdk-apollo-client': path.resolve(__dirname, '../../libs/sdk-apollo-client/src'),
      '@reasonote/lib-sdk-apollo-client-react': path.resolve(__dirname, '../../libs/sdk-apollo-client-react/src'),
      '@reasonote/lib-ai': path.resolve(__dirname, '../../libs/lib-ai/src'),
      '@reasonote/lib-ai-browser': path.resolve(__dirname, '../../libs/lib-ai-browser/src'),
    },
  },
};

export default defineConfig(baseConfig); 
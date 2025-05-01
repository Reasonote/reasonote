import {
  defineConfig,
  mergeConfig,
} from "vitest/config";

import {baseConfig} from "./vitest.config.base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ['**/*.api.{spec,test}.{js,ts,jsx,tsx}'],
    },
  })
); 
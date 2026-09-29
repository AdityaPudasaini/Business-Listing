// vitest.config.mts — unit and component tests (`npm test`). Test files live
// next to the code they cover as *.test.ts / *.test.tsx.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: {
    // tsconfig uses "jsx": "preserve" for Next; tests need it compiled.
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});

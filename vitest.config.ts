import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/helpers/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    globals: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
  },
});

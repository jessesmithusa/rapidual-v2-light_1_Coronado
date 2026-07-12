import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@rapidual/shared": path.resolve(__dirname, "packages/shared/src"),
      "@rapidual/utils": path.resolve(__dirname, "packages/utils/src"),
      "@rapidual/logistics-engine": path.resolve(__dirname, "packages/logistics-engine/src"),
    },
  },
  test: { include: ["packages/**/*.test.ts"] },
});

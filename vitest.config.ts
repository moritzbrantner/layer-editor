import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@moritzbrantner/layer-editor/core",
        replacement: path.resolve(rootDir, "src/core.ts"),
      },
      {
        find: "@moritzbrantner/layer-editor/history",
        replacement: path.resolve(rootDir, "src/history.ts"),
      },
      {
        find: "@moritzbrantner/layer-editor/react",
        replacement: path.resolve(rootDir, "src/react.tsx"),
      },
      {
        find: "@moritzbrantner/layer-editor/serialization",
        replacement: path.resolve(rootDir, "src/serialization.ts"),
      },
      {
        find: /^@moritzbrantner\/layer-editor$/,
        replacement: path.resolve(rootDir, "src/index.ts"),
      },
    ],
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "dist/**", "coverage/**"],
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});

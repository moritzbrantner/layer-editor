import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/layer-editor/" : "/",
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL("../dist-examples", import.meta.url)),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@moritzbrantner/layer-editor": fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      "@moritzbrantner/layer-editor/core": fileURLToPath(
        new URL("../src/core.ts", import.meta.url),
      ),
      "@moritzbrantner/layer-editor/history": fileURLToPath(
        new URL("../src/history.ts", import.meta.url),
      ),
      "@moritzbrantner/layer-editor/react": fileURLToPath(
        new URL("../src/react.tsx", import.meta.url),
      ),
      "@moritzbrantner/layer-editor/serialization": fileURLToPath(
        new URL("../src/serialization.ts", import.meta.url),
      ),
    },
  },
  root: fileURLToPath(new URL(".", import.meta.url)),
});

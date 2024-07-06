import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/js/index.ts",
      name: "FRANKENWC",
      fileName: "js/wc",
      formats: ["iife"],
    },
  },
});

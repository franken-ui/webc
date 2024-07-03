import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "js/wc.js",
        format: "iife",
      },
    },
  },
});

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: [
        "src/css/blue.css",
        "src/css/gray.css",
        "src/css/green.css",
        "src/css/neutral.css",
        "src/css/neutral.css",
        "src/css/orange.css",
        "src/css/red.css",
        "src/css/rose.css",
        "src/css/slate.css",
        "src/css/stone.css",
        "src/css/violet.css",
        "src/css/yellow.css",
        "src/css/zinc.css",
      ],
      output: {
        assetFileNames: ({ name }) => {
          if (name.endsWith(".css")) {
            return "css/[name].min.css";
          }
        },
      },
    },
  },
});

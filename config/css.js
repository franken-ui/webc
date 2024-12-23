import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: ['src/css/core.css'],
      output: {
        assetFileNames: ({ name }) => {
          if (name.endsWith('.css')) {
            return 'css/[name].min.css';
          }
        },
      },
    },
  },
});

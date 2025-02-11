import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: ['src/css/npf.css'],
      output: {
        assetFileNames: ({ name }) => {
          if (name.endsWith('.css')) {
            return 'css/[name].css';
          }
        },
      },
    },
  },
});

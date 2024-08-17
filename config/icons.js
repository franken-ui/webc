import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/icons.ts',
      name: 'LUCIDEICONS',
      fileName: 'js/icons',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'eof',
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/lucide.ts',
      name: 'LUCIDEICONS',
      fileName: 'js/lucide',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'eof',
  },
});

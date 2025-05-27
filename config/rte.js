import { defineConfig } from 'vite';
import shared from './shared.js';

export default defineConfig({
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/rte.ts',
      name: '__FRANKEN_UI_RTE__',
      fileName: 'js/rte',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

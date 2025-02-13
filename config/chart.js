import { defineConfig } from 'vite';
import shared from './shared.js';

export default defineConfig({
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/chart.ts',
      name: 'FRANKENUICHART',
      fileName: 'js/chart',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

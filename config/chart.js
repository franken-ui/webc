import { defineConfig } from 'vite';
import shared from './shared.js';

export default defineConfig({
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/chart.ts',
      name: '__FRANKEN_UI_CHART__',
      fileName: 'js/chart',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

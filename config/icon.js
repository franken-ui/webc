import { defineConfig } from 'vite';
import shared from './shared.js';

export default defineConfig({
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/icon.ts',
      name: '__FRANKEN_UI_ICON__',
      fileName: 'js/icon',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

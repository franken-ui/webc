import { defineConfig } from 'vite';
import shared from './shared.js';

export default defineConfig({
  build: {
    emptyOutDir: false,
    ...shared,
    lib: {
      entry: 'src/js/wysiwyg.ts',
      name: 'FRANKENUIWYSIWYG',
      fileName: 'js/wysiwyg',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

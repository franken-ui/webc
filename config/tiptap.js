import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/js/tiptap.ts',
      name: 'TIPTAP',
      fileName: 'js/tiptap',
      formats: ['iife'],
    },
  },
  esbuild: {
    legalComments: 'eof',
  },
});

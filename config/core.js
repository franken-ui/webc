import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/js/core.ts',
      name: 'FRANKENUICORE',
      fileName: 'js/core',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        globals: {
          lit: 'Lit',
          'lit/decorators.js': 'LitDecorators',
          'lit/directives/repeat.js': 'LitRepeat',
          'lit/directives/unsafe-html.js': 'LitUnsafeHTML',
        },
      },
    },
  },
  esbuild: {
    legalComments: 'none',
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: [
        'src/css/utilities-a-la-carte/margin.css',
        'src/css/utilities-a-la-carte/padding.css',
      ],
      output: {
        assetFileNames: ({ name }) => {
          if (name.endsWith('.css')) {
            return 'css/utilities-alc/[name].min.css';
          }
        },
      },
    },
  },
});

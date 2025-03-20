import franken from 'franken-ui/shadcn-ui/preset-quick';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [franken()],
  content: ['index.html', './src/**/*.{js,ts}'],
  safelist: [
    {
      pattern: /^uk-/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

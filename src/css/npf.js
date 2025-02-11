import franken from 'franken-ui/shadcn-ui/preset-quick';

/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: false,
  },
  presets: [franken()],
  safelist: [
    {
      pattern: /^uk-/,
    },

    'dark',

    'ProseMirror',
    'ProseMirror-focused',

    'tiptap',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

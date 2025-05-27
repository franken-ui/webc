import franken from 'franken-ui/shadcn-ui/preset-quick';
import chart from 'franken-ui/extensions/chart';
import rte from 'franken-ui/extensions/rte';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    franken({
      extensions: [
        [chart, {}],
        [rte, {}],
      ],
    }),
  ],
  content: ['*.html', './src/**/*.{js,ts}'],
  safelist: [
    {
      pattern: /^uk-/,
    },
    'ProseMirror',
    'ProseMirror-focused',
    'tiptap',
    'mr-2',
    'mt-2',
    'opacity-50',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

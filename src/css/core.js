import franken from 'franken-ui/shadcn-ui/preset-quick';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [franken()],
  safelist: [
    {
      pattern: /^uk-/,
    },
    {
      pattern:
        /^(bg|text)-(background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground)$/,
      variants: ['hover'],
    },

    'dark',

    'border-border',
    'border-input',

    'font-geist-sans',
    'font-geist-mono',

    'opacity-50',

    'ProseMirror',
    'ProseMirror-focused',

    'tiptap',

    'ring-ring',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

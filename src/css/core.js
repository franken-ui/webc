import franken from 'franken-ui/shadcn-ui/preset-quick';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [franken()],
  safelist: [
    {
      pattern: /^uk-/,
    },
    {
      pattern: /^block$/,
      variants: ['dark'],
    },
    {
      pattern: /^hidden$/,
      variants: ['dark'],
    },
    'bg-background',
    'bg-foreground',
    'bg-card',
    'bg-card-foreground',
    'bg-popover',
    'bg-popover-foreground',
    'bg-primary',
    'bg-primary-foreground',
    'bg-secondary',
    'bg-secondary-foreground',
    'bg-muted',
    'bg-muted-foreground',
    'bg-accent',
    'bg-accent-foreground',
    'bg-destructive',
    'bg-destructive-foreground',

    'dark',

    'border-border',
    'border-input',

    'font-geist-sans',
    'font-geist-mono',

    'opacity-50',

    'ProseMirror',
    'ProseMirror-focused',

    'size-4',

    'text-background',
    'text-foreground',
    'text-card',
    'text-card-foreground',
    'text-popover',
    'text-popover-foreground',
    'text-primary',
    'text-primary-foreground',
    'text-secondary',
    'text-secondary-foreground',
    'text-muted',
    'text-muted-foreground',
    'text-accent',
    'text-accent-foreground',
    'text-destructive',
    'text-destructive-foreground',

    'tiptap',

    'ring-ring',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

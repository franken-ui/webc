import franken from 'franken-ui/shadcn-ui/preset-quick';
import common from './common.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    common,
    franken({
      theme: 'rose',
    }),
  ],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};

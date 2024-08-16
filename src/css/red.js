import franken from 'franken-ui/shadcn-ui/preset-quick';
import common from './common.js';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    common,
    franken({
      theme: 'red',
    }),
  ],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};

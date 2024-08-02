import common from "./common";
import franken from "franken-ui/shadcn-ui/preset-quick";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    common,
    franken({
      theme: "blue",
    }),
  ],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};
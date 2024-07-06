import common from "./common";
import franken from "franken-ui/shadcn-ui/preset-quick";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [
    common,
    franken({
      theme: "green",
    }),
  ],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};

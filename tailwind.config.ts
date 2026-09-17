import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: { primary: "#D7A84B" },
        brand: { cyan: "#00ADEF" } // Cor extraída do logo.png
      },
    },
  },
  plugins: [],
};
export default config;
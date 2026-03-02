import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  important: "#__next",
  corePlugins: {
    preflight: false, // Let MUI handle base styles
  },
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef3ec",
          100: "#fde0cc",
          200: "#fbc1a0",
          300: "#f79d6e",
          400: "#f47d48",
          500: "#ea5c1f",
          600: "#d14a15",
          700: "#ad3a11",
          800: "#8a2f13",
          900: "#712913",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#1a1a2e",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Thai", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

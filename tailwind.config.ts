import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fail: {
          DEFAULT: "#dc2626",
          muted: "#b91c1c",
          soft: "#fef2f2",
          bg: "#ffffff",
          card: "#ffffff",
          border: "#e5e5e5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Hiragino Sans", "Yu Gothic", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;

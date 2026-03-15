import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fff9fd",
        card: "#ffffff",
        text: "#1f2937",
        accent: "#7c8cff",
        mint: "#8de4d5",
        peach: "#ffc6aa",
        lavender: "#d8c9ff",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(124, 140, 255, 0.12)",
      },
      borderRadius: {
        soft: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

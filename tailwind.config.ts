import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f4f4f5", // zinc-100
        card: "#ffffff",
        text: "#18181b", // zinc-900
        accent: "#4f46e5", // indigo-600
        mint: "#10b981", // emerald-500
        peach: "#f43f5e", // rose-500
        lavender: "#e0e7ff", // indigo-100
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        soft: "1rem", // slightly tighter than 1.25rem for a sharper look
      },
    },
  },
  plugins: [],
};

export default config;

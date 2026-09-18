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
    background: "var(--background)",
    foreground: "var(--foreground)",

    primary: "var(--primary)",
    secondary: "var(--secondary)",
    accent: "var(--accent)",
    danger: "var(--danger)",

    status: {
      verified: "var(--primary)",
      warning: "var(--accent)",
      risk: "var(--danger)",
    },
  },

  borderRadius: {
    card: "18px",
  },

  boxShadow: {
    card: "0 4px 20px rgba(23, 34, 29, 0.08)",
  },

  fontSize: {
    "metric-lg": [
      "2rem",
      {
        lineHeight: "2.5rem",
        fontWeight: "700",
      },
    ],
    "metric-xl": [
      "2.5rem",
      {
        lineHeight: "3rem",
        fontWeight: "700",
      },
    ],
  },
    },
  },
  plugins: [],
};

export default config;
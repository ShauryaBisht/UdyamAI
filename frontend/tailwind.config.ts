import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Authenticated Workspace Theme: Light Gray Canvas + Clean White Cards + Emerald Green Accent
        background: {
          DEFAULT: "var(--background)",
          app: "#F3F3F3",
          surface: "var(--surface)",
          subtle: "var(--surface-subtle)",
          muted: "var(--surface-muted)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
          subtle: "var(--foreground-subtle)",
          border: "var(--border)",
        },

        // Primary: Refined Emerald Green (Trust, Growth, Modern Financial SaaS)
        primary: {
          DEFAULT: "#159A68",
          50: "#E8F7F0",
          100: "#DDF3E9",
          200: "#C8EBDD",
          300: "#96D7BC",
          400: "#52BE93",
          500: "#159A68",
          600: "#128257",
          700: "#0F6746",
          800: "#0C4E36",
          900: "#0A3C2A",
          950: "#06261B",
        },

        // Electric Blue for Public Marketing / Landing Pages
        electric: {
          DEFAULT: "#2437F5",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#2437F5",
          600: "#1D2BD4",
          700: "#1621B0",
        },

        // Supporting Accents: Mint & Sage
        mint: {
          DEFAULT: "#B7DEC9",
          100: "#E8F7F0",
          200: "#DDF3E9",
          300: "#C8EBDD",
          400: "#B7DEC9",
        },

        // Supporting Accents: Lavender & Indigo
        secondary: {
          DEFAULT: "#6366F1",
          50: "#F5F7FF",
          100: "#EBF0FE",
          200: "#D6E0FD",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },

        // Alert / Warning: Amber
        accent: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },

        // Alert / Danger: Vibrant Crimson
        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },

        // Success / Verified: Emerald
        success: {
          DEFAULT: "#159A68",
          50: "#E8F7F0",
          100: "#DDF3E9",
          200: "#C8EBDD",
          500: "#159A68",
          600: "#128257",
        },

        // Neutral Border
        border: "var(--border)",
      },

      borderRadius: {
        'card-sm': '12px',
        'card': '16px',
        'card-lg': '20px',
        'card-xl': '24px',
        'app-shell': '32px',
      },

      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.02)',
        'app': '0 8px 30px rgba(0, 0, 0, 0.03)',
        'pill-active': '0 4px 14px rgba(21, 154, 104, 0.25)',
        'fintech-card': '0 12px 36px -8px rgba(21, 154, 104, 0.12)',
        'fintech-btn': '0 4px 14px rgba(21, 154, 104, 0.25)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        financial: ['Inter', 'system-ui', 'sans-serif'],
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'floatSlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
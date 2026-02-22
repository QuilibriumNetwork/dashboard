// tailwind.config.js
/** @type {import('tailwindcss').Config} */

// Helper: reads an RGB triplet CSS variable and enables Tailwind opacity modifiers
function withOpacityValue(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;
}

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  safelist: [
    "bg-light-pink",
    "text-pink",
    "bg-light-blue",
    "text-blue",
    "bg-light-orange",
    "text-orange",
    "bg-light-green",
    "text-green",
    "bg-light-purple",
    "text-purple",
  ],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        // Raw palette (theme-independent, opacity-compatible)
        burgundy: "rgb(64 0 27 / <alpha-value>)",
        white: "rgb(255 255 255 / <alpha-value>)",
        pink: "rgb(255 5 109 / <alpha-value>)",
        beige: "rgb(240 233 228 / <alpha-value>)",
        "dark-grey": "rgb(190 184 180 / <alpha-value>)",
        green: "rgb(34 169 65 / <alpha-value>)",
        blue: "rgb(2 135 242 / <alpha-value>)",
        orange: "rgb(255 96 0 / <alpha-value>)",
        purple: "rgb(99 48 202 / <alpha-value>)",
        "light-grey": "rgb(248 248 248 / <alpha-value>)",
        "light-pink": "rgb(255 230 240 / <alpha-value>)",
        "light-green": "rgb(219 244 220 / <alpha-value>)",
        "light-blue": "rgb(218 238 255 / <alpha-value>)",
        "light-purple": "rgb(231 221 255 / <alpha-value>)",
        "light-orange": "rgb(255 232 223 / <alpha-value>)",

        // Semantic surface colors (theme-aware, opacity-compatible)
        "surface-raised": withOpacityValue("--color-bg-surface-raised"),

        // Semantic shared colors (theme-aware, opacity-compatible)
        brand:   withOpacityValue("--color-brand"),
        accent:  withOpacityValue("--color-accent"),
        success: withOpacityValue("--color-success"),
        warning: withOpacityValue("--color-warning"),
        danger:  withOpacityValue("--color-danger"),
        info:    withOpacityValue("--color-info"),
      },

      // Background-only semantic tokens
      backgroundColor: {
        page:               "var(--color-bg-page)",
        surface:            "var(--color-bg-surface)",
        "surface-raised":   withOpacityValue("--color-bg-surface-raised"),
        "surface-subtle":   "var(--color-bg-surface-subtle)",
        "surface-inset":    "var(--color-bg-surface-inset)",
        overlay:            "var(--color-bg-overlay)",
        field:              "var(--color-field-bg)",
        "hover-highlight":  "var(--color-bg-hover-highlight)",
        "active-highlight": "var(--color-bg-active-highlight)",
        // Status subtle backgrounds
        "success-subtle": "var(--color-bg-success-subtle)",
        "warning-subtle": "var(--color-bg-warning-subtle)",
        "danger-subtle":  "var(--color-bg-danger-subtle)",
        "info-subtle":    "var(--color-bg-info-subtle)",
        "brand-subtle":   "var(--color-bg-brand-subtle)",
      },

      // Text-only semantic tokens
      textColor: {
        primary:   withOpacityValue("--color-text-primary"),
        secondary: "var(--color-text-secondary)",
        muted:     "var(--color-text-muted)",
        faint:     "var(--color-text-faint)",
      },

      // Border semantic tokens
      borderColor: {
        DEFAULT: "var(--color-border-default)",
        subtle:  "var(--color-border-subtle)",
        strong:  "var(--color-border-strong)",
      },

      // Focus ring
      ringColor: {
        brand: withOpacityValue("--color-brand"),
      },

      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'at-aero': ['AtAero', 'sans-serif'],
        'mono': ['GeistMono', 'monospace'],
      },

      letterSpacing: {
        label:   '0.3em',
      },

      // Theme-aware shadow scale
      boxShadow: {
        box:  "0px 8px 8px rgba(0, 0, 0, 0.02)",
        xs:   "0 8px 30px -12px rgba(var(--shadow-color), 0.12)",
        sm:   "0 8px 30px -12px rgba(var(--shadow-color), 0.25)",
        md:   "0 20px 50px -20px rgba(var(--shadow-color), 0.15)",
        lg:   "0 25px 60px -20px rgba(var(--shadow-color), 0.2)",
        xl:   "0 35px 80px -48px rgba(var(--shadow-color), 0.28)",
        glow: "0 0 30px -5px rgb(var(--color-brand) / 0.4)",
        status: "0 20px 40px -28px rgba(34, 169, 65, 0.5)",
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("can-hover", "@media (hover: hover) and (pointer: fine)");
    },
  ],
};

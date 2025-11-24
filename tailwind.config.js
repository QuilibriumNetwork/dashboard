// tailwind.config.js
/** @type {import('tailwindcss').Config} */

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
      colors: {
        // Opacity-compatible
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
       // Tailwind's default palette under a new key
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'at-aero': ['AtAero', 'sans-serif'],
      },
      boxShadow: {
        box: "0px 8px 8px rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [],
};

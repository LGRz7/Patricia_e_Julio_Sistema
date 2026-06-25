import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta da marca (azul + bege) — alinhada às referências
        navy: "#2F4156",
        teal: "#567C8D",
        sky: "#C8D9E6",
        beige: "#F5EFEB",
        ink: "#1B2530", // navy mais profundo p/ texto/fundo escuro
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        // escalas fluidas com clamp()
        "fluid-sm": "clamp(0.875rem, 0.8rem + 0.3vw, 1rem)",
        "fluid-base": "clamp(1rem, 0.9rem + 0.4vw, 1.125rem)",
        "fluid-lg": "clamp(1.25rem, 1rem + 1vw, 1.75rem)",
        "fluid-xl": "clamp(1.75rem, 1.2rem + 2.4vw, 3rem)",
        "fluid-2xl": "clamp(2.5rem, 1.5rem + 4.5vw, 5rem)",
        "fluid-mono": "clamp(3rem, 1rem + 11vw, 11rem)", // título monumental do hero
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      maxWidth: {
        editorial: "1600px",
      },
    },
  },
  plugins: [],
};

export default config;

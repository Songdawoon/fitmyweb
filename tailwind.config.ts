import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy acts as the near-black ink / dark surface.
        ink: "#101733",
        paper: "#ffffff",
        mist: "#f4f6fa",
        line: "#e5e8f0",
        muted: "#5c6472",
        faint: "#8a92a3",
        // Single vivid brand accent.
        accent: "#f05540",
        "accent-ink": "#c8402d",
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        display: ["Cabinet Grotesk", "Pretendard", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
      },
      maxWidth: {
        page: "1240px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-h)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

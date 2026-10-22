import path from "node:path";
import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Absolute paths so styles generate whichever folder the dev server starts from.
const config: Config = {
  content: [
    path.join(__dirname, "app/**/*.{ts,tsx}"),
    path.join(__dirname, "components/**/*.{ts,tsx}"),
  ],
  theme: {
    extend: {
      colors: {
        ivory: token("ivory"),
        surface: token("surface"),
        forest: token("forest"),
        "forest-tint": token("forest-tint"),
        "on-forest": token("on-forest"),
        gold: token("gold"),
        "gold-tint": token("gold-tint"),
        "gold-ink": token("gold-ink"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        up: token("up"),
        down: token("down"),
        "pill-sent": token("pill-sent"),
        "pill-sent-ink": token("pill-sent-ink"),
        "pill-viewed": token("pill-viewed"),
        "pill-viewed-ink": token("pill-viewed-ink"),
        "pill-paid": token("pill-paid"),
        "pill-paid-ink": token("pill-paid-ink"),
        "pill-muted": token("pill-muted"),
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(60 45 20 / 0.04), 0 4px 16px rgb(60 45 20 / 0.06)",
        lift: "0 8px 30px rgb(60 45 20 / 0.12)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        draw: { to: { strokeDashoffset: "0" } },
      },
      animation: {
        pop: "pop 450ms ease-out both",
        draw: "draw 500ms 250ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

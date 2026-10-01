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
        // Near-black ink + electric amber accent
        ink: {
          DEFAULT: "#0b0b10",
          soft: "#16161d",
          muted: "#24242e",
        },
        gold: {
          DEFAULT: "#ffb020",
          light: "#ffd27a",
          dark: "#a86400", // AA contrast on light backgrounds
        },
        coral: "#ff6a3d",
        cream: "#faf8f4",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 24px 60px -24px rgba(11,11,16,0.45)",
        card: "0 1px 2px rgba(11,11,16,0.04), 0 8px 24px -12px rgba(11,11,16,0.12)",
        glow: "0 0 0 1px rgba(255,176,32,0.25), 0 12px 40px -8px rgba(255,140,40,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(.2,.7,.2,1) both",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        float: "float 6s ease-in-out infinite",
        "ping-slow": "ping 2s cubic-bezier(0,0,.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0C",
        panel: "#141416",
        panel2: "#1C1C1F",
        line: "#2C2C30",
        // Commando red — the app's primary accent, matches the logo.
        signal: "#E8342B",
        signal2: "#C22A22",
        amber: "#F5B95B",
        // Kept distinct from the red brand accent so danger/overdue states
        // still read differently from "primary" — a warm orange instead.
        coral: "#FF7A45",
        mute: "#8A8D93",
        paper: "#F2F3F5"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(232,52,43,0.18), 0 8px 30px rgba(232,52,43,0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(232,52,43,0.4)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 6px rgba(232,52,43,0)" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        scan: "scan 6s linear infinite"
      }
    }
  },
  plugins: []
};
export default config;

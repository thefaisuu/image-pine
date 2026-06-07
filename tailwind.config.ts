import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   "#5B5BD6",
        "primary-hover": "#4F4FBF",
        "primary-light": "#EDEDFB",
        "primary-muted": "#E8E8F9",
        surface:   "#FFFFFF",
        "surface-2": "#F7F7FB",
        "surface-3": "#F1F1F7",
        border:    "#E4E4EF",
        "border-strong": "#D1D1E4",
        text:      "#111128",
        "text-2":  "#6B6B8A",
        "text-3":  "#9898B5",
        success:   "#10B981",
        warning:   "#F59E0B",
        danger:    "#EF4444",
      },
      fontFamily: {
        sans: [
          "Inter",
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        "card":    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-md": "0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)",
        "card-lg": "0 4px 16px rgba(0,0,0,0.1),  0 16px 48px rgba(0,0,0,0.08)",
        "btn":     "0 2px 8px rgba(91,91,214,0.3)",
        "btn-lg":  "0 4px 16px rgba(91,91,214,0.35)",
        "inner-sm":"inset 0 1px 3px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "xl2": "16px",
        "xl3": "20px",
        "xl4": "24px",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #5B5BD6 0%, #7C3AED 100%)",
        "gradient-subtle": "linear-gradient(135deg, #EDEDFB 0%, #F3F0FF 100%)",
        "gradient-surface": "linear-gradient(160deg, #FFFFFF 0%, #F7F7FB 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        "fade-in": "fadeIn 0.3s ease both",
        "scale-in": "scaleIn 0.25s ease both",
        "slide-down": "slideDown 0.3s ease both",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

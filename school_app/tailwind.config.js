/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./navigation/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1E3A8A",
          indigo: "#4F46E5",
          purple: "#7C3AED",
          emerald: "#10B981",
          slate: "#64748B",
          darkNavy: "#0B0F19",
          glassWhite: "rgba(255, 255, 255, 0.15)",
          glassDark: "rgba(15, 23, 42, 0.35)",
        }
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: "#F3E5D3",
        ink: "#700D0A",
        card: "#FFFAF1",
        slip: "#FFFAF1",
        line: "#D9BFA8",
        muted: "#7A5650",
        heart: "#CA4333",
        mahogany: "#CA4333",
        wheat: "#F6D8B7",
        orchid: "#DBA59E",
        burgundy: "#700D0A",
        "tag-school": "#F6D8B7",
        "tag-love": "#DBA59E",
        "tag-rant": "#F3D4CE",
        "tag-funny": "#F6D8B7",
        "tag-crush": "#DBA59E",
        "tag-life": "#F6D8B7",
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        stack: "4px 4px 0 #F6D8B7, 4px 4px 0 1px #700D0A",
      },
    },
  },
  plugins: [],
};

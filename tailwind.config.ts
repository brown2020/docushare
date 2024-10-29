import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"General Sans"', 'sans-serif'],
      },
      screens: {
        '2xl': '1600px',
        'between-lg-and-2xl': '1300px',
        'lg': '1201px',
        'md': '997px',
        'between-md-and-sm': '800px',
        'sm': '769px',
        'xs': '583px',
        'xxs': '361px',
      },
      boxShadow: {
        'pop-up-shadow': '0px 5px 20px rgba(0, 0, 0, 0.20)',
        'left': '-4px 0 10px rgba(0, 0, 0, 0.5)',
        'right': 'rgba(0, 0, 0, 0.20) 20px 0px 10px -20px',
        'bottom': 'rgba(0, 0, 0, 0.20) 0px 20px 10px -20px',
        'drop-shadow': 'rgba(0, 0, 0, 0.20) 0px 4px 8px 0px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lightGray: '#EFEFEF',
        ghostWhite: '#FCFCFC',
        mediumGray: '#ABABAB',
        richBlack: '#1E1E1E',
        slateGray: '#9CA3AF'
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
};
export default config;
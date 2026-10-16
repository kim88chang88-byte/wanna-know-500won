import type { Config } from "tailwindcss";

// 첨부된 Stitch 랜딩 HTML 의 tailwind.config 를 그대로 옮긴 설정입니다.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f4",
          100: "#ffe4e8",
          200: "#fecdd6",
          300: "#fea3b4",
          400: "#fc708b",
          500: "#f43f68",
          600: "#e11d4d",
          700: "#be123c",
          800: "#9f1237",
          900: "#841332",
        },
        gold: {
          50: "#fdfbf2",
          100: "#faf5df",
          200: "#f4e7b8",
          300: "#ecd38a",
          400: "#e1bd58",
          500: "#cca72f",
          600: "#b08722",
          700: "#8c651c",
          800: "#73501d",
        },
      },
      fontFamily: {
        serifKr: ['"Noto Serif KR"', '"Playfair Display"', "serif"],
        // 한글 글자가 폰트 로딩 전에도 자연스럽게 보이도록 시스템 한글 폰트를 뒤에 추가했어요.
        sans: ['"Plus Jakarta Sans"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

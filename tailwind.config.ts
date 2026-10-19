import type { Config } from "tailwindcss";

// 수달 도사 도리 랜딩 시안(Stitch)의 색상과 글꼴을 옮긴 설정입니다. DESIGN.md 와 같이 보세요.
const otter = {
  50: "#f0f7ff",
  100: "#e0effe",
  200: "#bae0fd",
  300: "#7ecbfb",
  400: "#3baaf5",
  500: "#225eaa",
  600: "#1b4d8d",
  700: "#163e72",
  800: "#14355f",
  900: "#152d4f",
};

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 수달 도사 '도리' 테마: 맑은 물빛 블루. (brand 와 otter 는 같은 팔레트의 다른 이름이에요)
        brand: otter,
        otter,
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
        serifKr: ['"Noto Serif KR"', "serif"],
        // 헤더 서비스 이름용 둥글둥글 귀여운 손글씨체 (주아체). 못 불러오면 기본 한글 글꼴로 보여요.
        cute: ['Jua', '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
        // 한글 글자가 폰트 로딩 전에도 자연스럽게 보이도록 시스템 한글 폰트를 뒤에 추가했어요.
        sans: ['"Plus Jakarta Sans"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

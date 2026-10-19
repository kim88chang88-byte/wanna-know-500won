import type { Config } from "tailwindcss";

// 도리 운세 사주의 색상·글꼴 설정입니다. (연보라 + 핑크 파스텔, 둥글둥글 주아체 제목) DESIGN.md 와 같이 보세요.
const otter = {
  50: "#f7f3ff",
  100: "#eee7ff",
  200: "#dccffc",
  300: "#c3a9fa",
  400: "#a07df0",
  500: "#8057e0",
  600: "#6d44cc",
  700: "#5a36a8",
  800: "#482b85",
  900: "#382366",
};

// 연한 분홍(블러시). Tailwind 의 sky(하늘색) 자리에 넣어서 기존 sky-* 클래스가 모두 말랑한 핑크 톤이 돼요.
const blush = {
  50: "#fff7fb",
  100: "#ffeaf5",
  200: "#ffd7ea",
  300: "#ffb9d9",
  400: "#ff95c6",
  500: "#e5508b",
  600: "#c8326f",
  700: "#a72a5e",
  800: "#86244e",
  900: "#6b1f41",
};

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 깜찍 파스텔 테마: 연보라(brand) + 말랑 핑크(sky 자리). (brand 와 otter 는 같은 팔레트의 다른 이름이에요)
        brand: otter,
        sky: blush,
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

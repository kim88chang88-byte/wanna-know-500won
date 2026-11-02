/** 화면 전체에 하늘에서 눈꽃송이가 천천히 내리는 배경이에요. (움직임 줄이기 설정이면 CSS 가 숨겨요) */
// delay 가 음수라서, 화면을 열자마자 눈이 이미 여기저기 내리는 중이에요.
const FLAKES: ReadonlyArray<{ size: number; left: string; duration: number; delay: number }> = [
  { size: 18, left: "4%", duration: 17, delay: -2 },
  { size: 11, left: "10%", duration: 21, delay: -11 },
  { size: 22, left: "17%", duration: 19, delay: -6 },
  { size: 13, left: "24%", duration: 15, delay: -13 },
  { size: 16, left: "31%", duration: 22, delay: -4 },
  { size: 10, left: "38%", duration: 18, delay: -9 },
  { size: 20, left: "45%", duration: 20, delay: -15 },
  { size: 14, left: "52%", duration: 16, delay: -1 },
  { size: 24, left: "59%", duration: 23, delay: -8 },
  { size: 12, left: "66%", duration: 17, delay: -12 },
  { size: 17, left: "73%", duration: 21, delay: -5 },
  { size: 10, left: "79%", duration: 15, delay: -10 },
  { size: 21, left: "85%", duration: 19, delay: -3 },
  { size: 13, left: "90%", duration: 18, delay: -14 },
  { size: 16, left: "96%", duration: 22, delay: -7 },
  { size: 11, left: "28%", duration: 24, delay: -17 },
];

export default function SnowBackground() {
  return (
    <div aria-hidden="true" data-testid="snow-background" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <div
          key={i}
          className="snow-item"
          style={{ left: f.left, width: f.size, height: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}
        />
      ))}
    </div>
  );
}

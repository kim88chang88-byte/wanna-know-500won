/** 화면 전체에 하늘에서 눈꽃송이가 천천히 내리는 배경이에요. (움직임 줄이기 설정이면 CSS 가 숨겨요) */
// delay 가 음수라서, 화면을 열자마자 눈이 이미 여기저기 내리는 중이에요.
// 48송이를 규칙으로 흩뿌려요(매번 같은 모양이라 서버/브라우저 화면이 어긋나지 않아요).
const COUNT = 48;
const FLAKES: ReadonlyArray<{ size: number; left: string; duration: number; delay: number }> = Array.from({ length: COUNT }, (_, i) => {
  const duration = 15 + ((i * 7) % 10); // 15~24초
  return {
    size: 10 + ((i * 5) % 15), // 10~24px
    left: `${(((i * 0.618034) % 1) * 96 + 2).toFixed(1)}%`, // 가로로 고르게
    duration,
    delay: -Math.round(((i * 0.381966) % 1) * duration * 10) / 10, // 시작 높이가 제각각
  };
});

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

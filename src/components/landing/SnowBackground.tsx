/** 화면 전체에 하늘에서 눈꽃송이가 천천히 내리는 배경이에요. (움직임 줄이기 설정이면 CSS 가 숨겨요) */
// delay 가 음수라서, 화면을 열자마자 눈이 이미 여기저기 내리는 중이에요.
// 96송이를 송이마다 크기·속도·흔들림·회전·진하기를 다르게 해서 진짜 눈처럼 흩날려요.
// (Math.random 을 쓰면 서버/브라우저 화면이 어긋나서, 같은 값이 나오는 간단한 난수를 써요)
const COUNT = 96;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = rng(20261102);
const FLAKES = Array.from({ length: COUNT }, () => {
  const big = r() < 0.2; // 가끔 큰 송이 (가까이 있는 눈 느낌)
  const size = big ? 20 + r() * 6 : 9 + r() * 11;
  const duration = (big ? 12 : 16) + r() * 16; // 큰 송이는 좀 더 빨리, 작은 송이는 더 느긋하게
  return {
    size: Math.round(size * 10) / 10,
    left: `${(r() * 100).toFixed(1)}%`,
    duration: Math.round(duration * 10) / 10,
    delay: -Math.round(r() * duration * 10) / 10,
    sway: Math.round(10 + r() * 38) * (r() < 0.5 ? -1 : 1), // 좌우 흔들림
    spin: Math.round((80 + r() * 300) * (r() < 0.5 ? -1 : 1)), // 도는 방향과 양
    op: Math.round((big ? 0.95 : 0.55 + r() * 0.4) * 100) / 100, // 작은 송이일수록 살짝 흐릿
  };
});

export default function SnowBackground() {
  return (
    <div aria-hidden="true" data-testid="snow-background" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <div
          key={i}
          className="snow-item"
          style={
            {
              left: f.left,
              width: f.size,
              height: f.size,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--sway": `${f.sway}px`,
              "--spin": `${f.spin}deg`,
              "--op": f.op,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

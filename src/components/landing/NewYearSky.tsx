/*
 * 2027 신년운 풀이를 만드는 동안 보여주는 새벽 풍경이에요. (LoadingScene 의 밤하늘 대신 들어가요)
 * 처음엔 깜깜한 밤하늘에 불꽃이 터지다가, 진행률(--p, 0~1)이 오르면 밤이 걷히며 새벽 풍경이 드러나고
 * 해 스티커가 수평선에서 떠올라요. 구름 위 양은 처음부터 함께 해돋이를 기다리다가 끝나면(ny-done) 폴짝 뛰어요.
 * 진행률은 부모가 style 의 --p 로 내려 줘요. (움직임은 globals.css 의 .ny-* 규칙)
 */
const BURSTS: Array<[number, number, string]> = [
  [70, 130, "#ff95c6"],
  [280, 110, "#ffd98a"],
  [180, 190, "#9ff3e1"],
  [40, 240, "#a07df0"],
  [320, 225, "#ffffff"],
  [130, 60, "#ff9f7a"],
  [240, 60, "#9ff3e1"],
];
const STARS: Array<[number, number, number, number]> = [
  [40, 60, 1.4, 0], [200, 50, 1.6, 1.2], [330, 40, 1, 1.6], [70, 170, 1, 0.9],
  [150, 190, 1, 2], [320, 200, 1.2, 0], [110, 100, 1.2, 0.5], [260, 130, 1, 1.9],
];
const RAYS = Array.from({ length: 18 }, (_, i) => {
  const a = (i * 20 * Math.PI) / 180;
  const long = i % 2 === 0;
  return { x1: Math.cos(a) * 10, y1: Math.sin(a) * 10, x2: Math.cos(a) * (long ? 62 : 46), y2: Math.sin(a) * (long ? 62 : 46), dx: Math.cos(a + 0.17) * 72, dy: Math.sin(a + 0.17) * 72 };
});

export default function NewYearSky() {
  return (
    <svg aria-hidden="true" viewBox="0 0 360 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="nyNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c0838" />
          <stop offset=".7" stopColor="#2b1a80" />
          <stop offset="1" stopColor="#4a2f9c" />
        </linearGradient>
        <linearGradient id="nyScrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2a9a" stopOpacity="0" />
          <stop offset=".55" stopColor="#4a2a9a" stopOpacity=".62" />
          <stop offset="1" stopColor="#3a1f84" stopOpacity=".9" />
        </linearGradient>
        <radialGradient id="nyHalo">
          <stop offset="0" stopColor="#fff0b0" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff0b0" stopOpacity="0" />
        </radialGradient>
        <clipPath id="nyHorizon">
          <rect x="0" y="0" width="360" height="345" />
        </clipPath>
      </defs>
      <image href="/images/ny-bg.webp" x="0" y="0" width="360" height="510" preserveAspectRatio="none" />
      <rect className="ny-night" width="360" height="500" fill="url(#nyNight)" />
      <g className="ny-stars">
        {STARS.map(([x, y, r, d], i) => (
          <circle key={i} className="ls-tw" cx={x} cy={y} r={r} fill="#fff" style={{ animationDelay: `${d}s` }} />
        ))}
      </g>
      <g>
        {BURSTS.map(([x, y, c], k) => {
          const d = `${((k * 0.55) % 3.4).toFixed(2)}s`;
          return (
            <g key={k} className="ny-fw" style={{ ["--k" as string]: k, color: c }}>
              <circle className="ny-rk" cx={x} cy={420} r={2.6} fill="#fff3c0" style={{ ["--up" as string]: `${y - 420}px`, ["--d" as string]: d }} />
              <g transform={`translate(${x} ${y})`}>
                <g className="ny-bst" style={{ ["--d" as string]: d }}>
                  {RAYS.map((r, i) => (
                    <g key={i}>
                      <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={c} strokeWidth={3.6} strokeLinecap="round" />
                      <circle cx={r.dx} cy={r.dy} r={2.6} fill={c} />
                    </g>
                  ))}
                </g>
              </g>
            </g>
          );
        })}
      </g>
      <g clipPath="url(#nyHorizon)">
        <g className="ny-sun">
          <circle className="ny-halo" cx="180" cy="345" r="130" fill="url(#nyHalo)" />
          <g className="ny-swy">
            <image href="/images/ny-sun.webp" x="80" y="244" width="200" height="201" />
          </g>
          <g fill="#fff3c0">
            <text className="ls-tw" x="60" y="270" fontSize="14">✦</text>
            <text className="ls-tw" x="300" y="300" fontSize="11" style={{ animationDelay: ".8s" }}>✦</text>
            <text className="ls-tw" x="285" y="230" fontSize="16" style={{ animationDelay: "1.5s" }}>✦</text>
          </g>
        </g>
      </g>
      <rect y="372" width="360" height="130" fill="url(#nyScrim)" />
      <g className="ny-cloud">
        <g fill="#fff4fa">
          <ellipse cx="268" cy="356" rx="58" ry="14" />
          <ellipse cx="240" cy="350" rx="26" ry="13" />
          <ellipse cx="296" cy="349" rx="26" ry="14" />
        </g>
      </g>
      <g className="ny-sheep">
        <image href="/images/ny-sheep.webp" x="226" y="262" width="84" height="98" />
      </g>
    </svg>
  );
}

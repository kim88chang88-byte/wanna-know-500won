"use client";

/** 프리미엄 불꽃놀이 연출에 쓰는 불꽃 위치·색·시작 시간 (매번 같은 모양이라 서버/브라우저가 어긋나지 않아요) */
const BURSTS = [
  { x: 50, y: 33, delay: 0.1, color: "#ffd873", alt: "#fff6d6" },
  { x: 22, y: 45, delay: 0.5, color: "#ff9ec7", alt: "#ffe3ef" },
  { x: 78, y: 41, delay: 0.8, color: "#b9a2ff", alt: "#ece4ff" },
  { x: 36, y: 24, delay: 1.1, color: "#ffc857", alt: "#fff0c2" },
  { x: 66, y: 27, delay: 1.35, color: "#8fd8ff", alt: "#e1f5ff" },
];
const RAYS = 18;
const SPARKS = 10;

/** 500원 동전(또는 1,000원 지폐)이 톡 떨어지는 짧은 연출. luxe 면 동전 대신 금빛 불꽃놀이가 터져요. 끝나면 부모가 입력창을 열어요. (움직임 줄이기 설정이면 아예 만들지 않아요) */
export default function CoinRitual({ bill = false, luxe = false }: { bill?: boolean; luxe?: boolean }) {
  if (luxe) {
    return (
      <div className="fw-ritual" aria-hidden="true" data-testid="fw-ritual">
        <div className="fw-glow" />
        {BURSTS.map((b, i) => (
          <div key={i} className="fw-burst" style={{ left: `${b.x}%`, top: `${b.y}%`, ["--d" as string]: `${b.delay}s`, ["--c" as string]: b.color, ["--c2" as string]: b.alt }}>
            <span className="fw-rocket" />
            <span className="fw-flash" />
            {Array.from({ length: RAYS }, (_, k) => (
              <span key={`r${k}`} className="fw-ray" style={{ ["--a" as string]: `${(360 / RAYS) * k + (i % 2) * 5}deg`, ["--r" as string]: `${k % 2 ? 74 : 104}px` }} />
            ))}
            {Array.from({ length: SPARKS }, (_, k) => (
              <span key={`s${k}`} className="fw-spark" style={{ ["--a" as string]: `${(360 / SPARKS) * k + 14}deg`, ["--r" as string]: `${50 + (k % 3) * 14}px` }} />
            ))}
          </div>
        ))}
        <p className="fw-text">도리가 특별한 운세를 준비하는 중… ✨</p>
      </div>
    );
  }
  return (
    <div className={`coin-ritual${bill ? " coin-ritual-bill" : ""}`} aria-hidden="true" data-testid="coin-ritual">
      <div className="coin-ritual-slot" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {bill ? (
        <img src="/images/bill-1000.webp" alt="" width={168} height={94} className="coin-ritual-coin coin-ritual-note" />
      ) : (
        <img src="/images/coin-500.webp" alt="" width={96} height={96} className="coin-ritual-coin" />
      )}
      <p className="coin-ritual-text">도리가 운세를 꺼내는 중… 🫧</p>
    </div>
  );
}

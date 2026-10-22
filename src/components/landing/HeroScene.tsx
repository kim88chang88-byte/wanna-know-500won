import SafeImage from "./SafeImage";

/*
 * 그림 한 장을 부위별로 잘라 겹쳐서, 그 부분만 살짝 움직여요. (영상이 아니라 CSS 애니메이션이에요)
 * 좌표는 그림(1006×546) 안의 위치를 %로 적은 거예요. 그림을 바꾸면 이 좌표도 다시 맞춰야 해요.
 */
const W = 1006;
const H = 546;

interface Part {
  cls: string;
  /** 그림 안의 픽셀 영역 */
  x: number;
  y: number;
  w: number;
  h: number;
  delay?: number;
}

const PARTS: Part[] = [
  { cls: "hero-wave", x: 236, y: 238, w: 78, h: 84 }, // 여우 손 흔들기
  { cls: "hero-sway", x: 100, y: 290, w: 70, h: 82 }, // 여우 꼬리
  { cls: "hero-ear", x: 280, y: 160, w: 120, h: 105, delay: 0.4 }, // 토끼 귀
  { cls: "hero-star", x: 350, y: 330, w: 85, h: 80 }, // 토끼 별
  { cls: "hero-whisker", x: 655, y: 242, w: 100, h: 60 }, // 용 수염
  { cls: "hero-flame", x: 722, y: 335, w: 70, h: 80 }, // 판다 불꽃
];

const GLOWS = [
  { x: 505, y: 362, r: 46, color: "rgba(255,214,120,.9)", delay: 0 }, // 나침반
  { x: 758, y: 385, r: 52, color: "rgba(255,150,60,.85)", delay: 0.5 }, // 불꽃
];

const TWINKLES = [
  { x: 105, y: 68, delay: 0 },
  { x: 905, y: 118, delay: 0.8 },
  { x: 120, y: 292, delay: 1.5 },
  { x: 560, y: 148, delay: 0.4 },
  { x: 935, y: 462, delay: 1.1 },
];

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export default function HeroScene({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 shadow-sm">
      {/* 그림 비율(1006:546)로 가운데에 놓고 양옆을 잘라 보여줘요. (예전 object-cover 와 같은 모양) */}
      <div className="absolute top-0 left-1/2 h-full -translate-x-1/2" style={{ aspectRatio: `${W} / ${H}` }}>
        <SafeImage src={src} alt={alt} className="w-full h-full object-cover" fallback="🦦" fallbackClass="text-8xl" />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          {PARTS.map((p) => (
            <div
              key={p.cls}
              className={`hero-part ${p.cls}`}
              style={{
                left: pct(p.x, W),
                top: pct(p.y, H),
                width: pct(p.w, W),
                height: pct(p.h, H),
                backgroundImage: `url(${src})`,
                backgroundSize: `${(W / p.w) * 100}% ${(H / p.h) * 100}%`,
                backgroundPosition: `${(p.x / (W - p.w)) * 100}% ${(p.y / (H - p.h)) * 100}%`,
                animationDelay: p.delay ? `${p.delay}s` : undefined,
              }}
            />
          ))}
          {GLOWS.map((g, i) => (
            <div
              key={i}
              className="absolute rounded-full hero-glow mix-blend-screen"
              style={{
                left: pct(g.x - g.r, W),
                top: pct(g.y - g.r, H),
                width: pct(g.r * 2, W),
                height: pct(g.r * 2, H),
                background: `radial-gradient(circle, ${g.color} 0%, transparent 68%)`,
                animationDelay: `${g.delay}s`,
              }}
            />
          ))}
          {TWINKLES.map((t, i) => (
            <span
              key={i}
              className="absolute hero-twinkle text-yellow-100 drop-shadow-[0_0_4px_rgba(255,230,150,.9)] leading-none"
              style={{ left: pct(t.x, W), top: pct(t.y, H), fontSize: "clamp(10px, 2.2vw, 18px)", animationDelay: `${t.delay}s` }}
            >
              ✦
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

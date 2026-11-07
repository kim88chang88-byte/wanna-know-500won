import { BODY_GROUPS, BODY_IMG, STATE_SHORT, STATE_TEXT, bodyWhy, topBodyPicks, type BodyEl, type BodyState } from "@/lib/premium/bodyMap";
import type { ElementView } from "@/lib/premium/types";

/** 오행별 표시 색 (밝은 바탕 위) */
const COLOR: Record<BodyEl, string> = { 목: "#3fa66b", 화: "#e5484d", 토: "#d9a21b", 금: "#8a9bb0", 수: "#3b82f6" };
const STATE_COLOR: Record<BodyState, string> = { fill: "#1d4ed8", rest: "#be123c", ok: "#666666" };

/** 작은 지도는 글 목록 높이에 맞춰 그림을 세로로 이만큼 늘려요 */
const COMPACT_STRETCH = 1.25;
const IMG_LEFT = 27; // 그림이 차지하는 가로 위치(%)
const IMG_W = 46;
const px = (x: number) => IMG_LEFT + (IMG_W * x) / BODY_IMG.w;
const py = (y: number) => (100 * y) / BODY_IMG.h;

/** 인체 그림 위에 오행 장부를 표시하는 지도. compact 이면 라벨 없이 색 점만 그려요. */
export default function BodyFigure({ states, focus, compact = false }: { states: Partial<Record<BodyEl, BodyState>>; focus?: BodyEl | null; compact?: boolean }) {
  return (
    <div
      data-testid={compact ? "body-figure-mini" : "body-figure"}
      className="relative mx-auto w-full overflow-hidden rounded-2xl bg-white"
      style={{ aspectRatio: compact ? `${BODY_IMG.w} / ${BODY_IMG.h / COMPACT_STRETCH}` : "1000 / 908", maxWidth: compact ? 120 : 440 }}
      role="img"
      aria-label="오행 장부 지도: 기운별로 챙기면 좋은 몸의 곳"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/body-map.webp"
        alt=""
        width={BODY_IMG.w}
        height={BODY_IMG.h}
        className={`absolute top-0 h-full ${compact ? "object-fill" : "object-contain"}`}
        style={compact ? { left: 0, width: "100%" } : { left: `${IMG_LEFT}%`, width: `${IMG_W}%` }}
      />
      {BODY_GROUPS.map((g) => {
        const st = states[g.el];
        if (!st) return null;
        const c = COLOR[g.el];
        const map = (x: number, y: number) => (compact ? { x: (100 * x) / BODY_IMG.w, y: py(y) } : { x: px(x), y: py(y) });
        return (
          <span key={g.el}>
            {g.marks.map(([x, y], i) => {
              const p = map(x, y);
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: compact ? 9 : 14,
                    height: compact ? 9 : 14,
                    border: `${st === "rest" ? 2.5 : 1.5}px ${st === "fill" ? "dashed" : "solid"} ${c}`,
                    boxShadow: `inset 0 0 0 2px ${c}`,
                  }}
                >
                  {focus === g.el && !compact && <i className="absolute inset-[-5px] rounded-full border-2 border-amber-400 motion-safe:animate-ping" />}
                </span>
              );
            })}
          </span>
        );
      })}
      {!compact && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {BODY_GROUPS.map((g) => {
              if (!states[g.el]) return null;
              const [mx, my] = g.marks[0];
              const lx = g.side === "L" ? 27 : 73;
              return <line key={g.el} x1={`${lx}%`} y1={`${py(g.y)}%`} x2={`${px(mx)}%`} y2={`${py(my)}%`} stroke={COLOR[g.el]} strokeWidth="1.6" strokeLinecap="round" />;
            })}
          </svg>
          {BODY_GROUPS.map((g) => {
            const st = states[g.el];
            if (!st) return null;
            return (
              <div
                key={g.el}
                data-testid="body-label"
                className="absolute -translate-y-1/2 rounded-xl border-2 bg-white px-1.5 py-1 leading-tight"
                style={{ top: `${py(g.y)}%`, [g.side === "L" ? "left" : "right"]: "1.5%", width: "25%", borderColor: COLOR[g.el] }}
              >
                <p className="flex items-center gap-1 text-[12px] font-extrabold text-gray-900">
                  <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: COLOR[g.el] }} />
                  <span className="truncate">{g.label}</span>
                </p>
                <p className="whitespace-nowrap text-[10.5px] font-bold" style={{ color: STATE_COLOR[st] }}>{STATE_SHORT[st]}</p>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const CHIP: Record<BodyState, string> = { fill: "bg-blue-50 text-blue-700", rest: "bg-rose-50 text-rose-700", ok: "bg-gray-100 text-gray-600" };

/** 500원 건강운 결과서용 작은 요약: 작은 인체 그림 + 챙길 곳 3가지 */
export function BodyPicks({ states, elements }: { states: Partial<Record<BodyEl, BodyState>>; elements?: ElementView[] }) {
  const picks = topBodyPicks(states);
  if (picks.length === 0) return null;
  return (
    <section data-testid="story-body" aria-label="내 몸 기운 지도" className="rounded-2xl border border-brand-100 bg-white p-4">
      <p className="text-xs font-bold text-brand-700">내 몸 기운 지도</p>
      <div className="mt-2.5 flex items-center gap-3.5">
        <div className="w-[112px] shrink-0">
          <BodyFigure states={states} compact />
        </div>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {picks.map(({ group: g, state }) => (
            <li key={g.el} className="flex items-start gap-2">
              <i className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[g.el] }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-extrabold text-gray-900">
                  {g.area}
                  <span className={`ml-1.5 rounded-full px-2 py-px align-[1px] text-[10.5px] font-bold ${CHIP[state]}`}>{STATE_TEXT[state]}</span>
                </p>
                {elements && elements.length > 0 && <p data-testid="body-why" className="text-[11.5px] leading-relaxed text-gray-500">{bodyWhy(g.el, state, elements)}</p>}
                <p className="text-[12.5px] leading-relaxed text-gray-600">{g.habit}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">병이나 증상을 알려 주는 그림이 아니에요. 생활 습관을 정할 때 참고하는 전통 오행 대응이고, 몸이 불편하면 꼭 전문가와 상담해 주세요.</p>
    </section>
  );
}

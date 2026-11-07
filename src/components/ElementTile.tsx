import { ElIconName } from "@/components/ElIcon";
import type { Element } from "@/lib/saju/constants";

/** 오행마다 그림에서 가장 눈에 띄는 높이(위→아래 %). 정사각형에 가깝게 잘릴 때 중심이 되게 해요. */
const FOCUS: Record<Element, string> = { fire: "70%", earth: "60%", wood: "55%", water: "55%", metal: "45%" };

/**
 * 오행마다 색감을 또렷하게 해 주는 값. dark: 글자 뒤·표시 바탕의 짙은 색(r,g,b), tint: 그림 위에 덧입히는 색,
 * strength: 덧입히는 세기(나무는 그림이 초록에 묻히지 않게 약하게).
 */
const TONE: Record<Element, { dark: string; tint: string; strength: number }> = {
  fire: { dark: "140,20,10", tint: "255,60,30", strength: 0.75 },
  earth: { dark: "100,55,10", tint: "230,150,40", strength: 0.75 },
  wood: { dark: "10,70,30", tint: "40,200,90", strength: 0.5 },
  water: { dark: "10,40,130", tint: "40,110,255", strength: 0.75 },
  metal: { dark: "55,60,75", tint: "200,210,225", strength: 0.75 },
};

/**
 * 사주 기둥 한 칸: 오행 그림을 배경으로 깔고, 한자 한 글자를 크고 선명하게 얹어요.
 * 오른쪽 위에는 오행 이름, 아래에는 한글 음(reading)을 작게 보여 줘요.
 * `tone`은 아래 한글 음 글자색(밝은 화면 "light" / 어두운 프리미엄 책 "dark")이에요.
 */
export default function ElementTile({
  ch,
  el,
  reading,
  tone = "light",
  label,
  sizeClass = "text-[38px]",
  compact = false,
}: {
  ch: string | null;
  el: Element | null;
  reading?: string | null;
  tone?: "light" | "dark";
  label?: string;
  sizeClass?: string;
  /** 작은 글자용: 테두리를 가늘게, 오행 이름표를 작게 */
  compact?: boolean;
}) {
  const kind: Element = el ?? "earth";
  const t = TONE[kind];
  return (
    <div className="text-center" aria-label={label}>
      <div className="relative aspect-[1/1.05] overflow-hidden rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
        {/* 그림: 채도를 올리고 오행 색을 덧입혀서, 불은 빨갛게·물은 파랗게 한눈에 보이게 해요 */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover [filter:saturate(1.3)_contrast(1.05)]"
          style={{ backgroundImage: `url(/images/el-${kind}.webp)`, backgroundPosition: `50% ${FOCUS[kind]}` }}
        />
        <div aria-hidden="true" className="absolute inset-0 mix-blend-soft-light" style={{ background: `rgb(${t.tint})`, opacity: t.strength }} />
        {/* 한자 뒤만 오행의 짙은 색으로 살짝 눌러서 밝은 그림에서도 글자가 묻히지 않게 해요 */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${t.dark},0.45) 0, rgba(${t.dark},0) 65%)` }} />
        {el && (
          <span data-testid="element-chip" className={`absolute right-1 top-1 z-10 whitespace-nowrap rounded-full px-1.5 py-0.5 font-sans ${compact ? "text-[9px]" : "text-[10px]"} font-bold leading-tight text-white`} style={{ background: `rgba(${t.dark},0.85)` }}>
            <ElIconName e={el} />
          </span>
        )}
        <span
          aria-hidden="true"
          className={`absolute inset-0 z-[5] flex items-center justify-center font-serifKr font-black leading-none text-white [paint-order:stroke_fill] ${compact ? "[-webkit-text-stroke:2px_rgba(20,10,8,0.92)]" : "[-webkit-text-stroke:4px_rgba(20,10,8,0.92)]"} [text-shadow:0_2px_5px_rgba(0,0,0,0.4)] ${sizeClass}`}
        >
          {ch}
        </span>
      </div>
      {reading !== undefined && (
        <div className={`mt-0.5 text-[10px] font-bold ${tone === "dark" ? "text-[#e8dfca]/75" : "text-gray-500"}`}>{reading ?? ""}</div>
      )}
    </div>
  );
}

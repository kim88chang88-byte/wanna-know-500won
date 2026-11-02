import { EL_LABEL } from "@/lib/elementColor";
import type { Element } from "@/lib/saju/constants";

/** 오행마다 그림에서 가장 눈에 띄는 높이(위→아래 %). 정사각형에 가깝게 잘릴 때 중심이 되게 해요. */
const FOCUS: Record<Element, string> = { fire: "70%", earth: "60%", wood: "55%", water: "55%", metal: "45%" };

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
  sizeClass = "text-[40px]",
}: {
  ch: string | null;
  el: Element | null;
  reading?: string | null;
  tone?: "light" | "dark";
  label?: string;
  sizeClass?: string;
}) {
  const kind: Element = el ?? "earth";
  return (
    <div className="text-center" aria-label={label}>
      <div
        className="relative aspect-[1/1.05] overflow-hidden rounded-xl bg-cover shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
        style={{ backgroundImage: `url(/images/el-${kind}.webp)`, backgroundPosition: `50% ${FOCUS[kind]}` }}
      >
        {/* 한자 뒤만 살짝 어둡게 눌러서 밝은 그림에서도 글자가 묻히지 않게 해요 */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(25,12,55,0.55)_0,rgba(25,12,55,0.35)_38%,rgba(25,12,55,0)_70%)]" />
        {el && (
          <span data-testid="element-chip" className="absolute right-1 top-1 z-10 whitespace-nowrap rounded-full bg-[rgba(25,12,55,0.72)] px-1.5 py-0.5 font-sans text-[10px] font-bold leading-tight text-white ring-1 ring-white/35">
            {EL_LABEL[el].icon} {EL_LABEL[el].name}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center font-serifKr font-black leading-none text-white [paint-order:stroke_fill] [-webkit-text-stroke:5px_rgba(28,12,62,0.95)] [text-shadow:0_2px_6px_rgba(20,8,50,0.7)] ${sizeClass}`}
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

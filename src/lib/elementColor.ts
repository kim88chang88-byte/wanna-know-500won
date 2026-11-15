import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";

/** 오행 색: 목(초록) · 화(주황빛 붉은색) · 토(황토색) · 금(밝은 회색빛) · 수(남색). 전통색보다 한눈에 알아보기 쉽게 골랐어요. */
export const ELEMENT_BOX: Record<Element, string> = {
  wood: "bg-green-500 text-white",
  fire: "bg-[#f2512b] text-white",
  earth: "bg-[#c68a3d] text-white",
  metal: "bg-slate-200 text-slate-700",
  water: "bg-indigo-900 text-white",
};

/** 오행 색의 부드러운 버전(밝은 화면의 칩용). 개수가 0이면 점선 테두리로 따로 그려요. */
export const ELEMENT_SOFT: Record<Element, string> = {
  wood: "bg-green-100 text-green-800",
  fire: "bg-[#fde6df] text-[#c2410c]",
  earth: "bg-[#f6ead7] text-[#8a5a17]",
  metal: "bg-slate-100 text-slate-600",
  water: "bg-indigo-100 text-indigo-900",
};
export const ELEMENT_SOFT_ZERO = "border border-dashed border-gray-300 bg-transparent text-gray-400";

/** 풀이 표에 쓰는 한글 오행 이름(목·화·토·금·수)을 오행 종류로 바꿔요. 모르는 이름이면 null. */
export function elementOfKo(name: string): Element | null {
  return ({ 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" } as Record<string, Element>)[name] ?? null;
}

/** 간지 한 글자의 오행 (천간이면 천간표, 지지면 지지표에서 찾아요) */
export function elementOfChar(ch: string | null | undefined, branch: boolean): Element | null {
  if (!ch) return null;
  const hit = branch ? BRANCHES.find((b) => b.hanja === ch) : STEMS.find((s) => s.hanja === ch);
  return hit ? hit.element : null;
}

/** 화면에 보이는 오행 이름. 금은 쉬운 말로 "쇠"라고 불러요. (계산용 이름은 그대로 "금") */
export function elName(name: string): string {
  return name === "금" ? "쇠" : name;
}

/** 500원 풀이 화면에서 쓰는 쉬운 말 오행 이름 (나무·불·땅·쇠·물) */
export function elEasyName(name: string): string {
  return ({ 목: "나무", 화: "불", 토: "땅", 금: "쇠", 수: "물" } as Record<string, string>)[name] ?? name;
}

/** 박스 모서리에 붙이는 쉬운 말 이름과 그림. 금은 "쇠"예요. */
export const EL_LABEL: Record<Element, { name: string; icon: string }> = {
  wood: { name: "나무", icon: "🌳" },
  fire: { name: "불", icon: "🔥" },
  earth: { name: "땅", icon: "⛰️" },
  metal: { name: "쇠", icon: "🪙" },
  water: { name: "물", icon: "💧" },
};

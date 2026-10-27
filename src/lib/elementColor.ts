import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";

/** 오행 색: 목(초록) · 화(주황빛 붉은색) · 토(황토색) · 금(밝은 회색빛) · 수(남색). 전통색보다 한눈에 알아보기 쉽게 골랐어요. */
export const ELEMENT_BOX: Record<Element, string> = {
  wood: "bg-green-500 text-white",
  fire: "bg-[#f2512b] text-white",
  earth: "bg-[#c68a3d] text-white",
  metal: "bg-slate-200 text-slate-700",
  water: "bg-indigo-900 text-white",
};

/** 간지 한 글자의 오행 (천간이면 천간표, 지지면 지지표에서 찾아요) */
export function elementOfChar(ch: string | null | undefined, branch: boolean): Element | null {
  if (!ch) return null;
  const hit = branch ? BRANCHES.find((b) => b.hanja === ch) : STEMS.find((s) => s.hanja === ch);
  return hit ? hit.element : null;
}

import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";

/** 오행 전통색: 목(푸른 초록) · 화(붉은색) · 토(노란색) · 금(흰색) · 수(검은색). 사주 기둥 글자 칸에 써요. */
export const ELEMENT_BOX: Record<Element, string> = {
  wood: "bg-green-500 text-white",
  fire: "bg-red-500 text-white",
  earth: "bg-yellow-300 text-yellow-950",
  metal: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300",
  water: "bg-slate-900 text-white",
};

/** 간지 한 글자의 오행 (천간이면 천간표, 지지면 지지표에서 찾아요) */
export function elementOfChar(ch: string | null | undefined, branch: boolean): Element | null {
  if (!ch) return null;
  const hit = branch ? BRANCHES.find((b) => b.hanja === ch) : STEMS.find((s) => s.hanja === ch);
  return hit ? hit.element : null;
}

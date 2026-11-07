/*
 * 도리 답 속 약속된 표시를 다뤄요.
 * - 맨 앞 이모지 하나: 답의 분위기(화면에서 크게 보여 줘요)
 * - [[물]] 처럼 오행 이름: 화면에서 그림 알약으로 바뀌어요
 */

export const ELEMENT_BY_NAME = { 나무: "wood", 불: "fire", 땅: "earth", 쇠: "metal", 물: "water" } as const;
export type MarkElement = (typeof ELEMENT_BY_NAME)[keyof typeof ELEMENT_BY_NAME];

const LEAD = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s+/u;

/** 답의 맨 앞 이모지를 떼어 내요. 없으면 emoji 는 null. */
export function splitMood(text: string): { emoji: string | null; rest: string } {
  const m = LEAD.exec(text);
  if (!m) return { emoji: null, rest: text };
  const rest = text.slice(m[0].length);
  // 본문이 이모지 하나뿐이면 그대로 둬요
  return rest.trim() ? { emoji: m[1], rest } : { emoji: null, rest: text };
}

/** [[물]] 표시를 글/알약 조각으로 나눠요. 타이핑 중 덜 써진 표시("[[물")는 숨겨요. */
export function splitElements(text: string): Array<{ text: string } | { el: MarkElement; name: string }> {
  const t = text.replace(/\[\[[^\]]{0,4}$/, "").replace(/\[$/, "");
  const out: Array<{ text: string } | { el: MarkElement; name: string }> = [];
  let last = 0;
  for (const m of t.matchAll(/\[\[(나무|불|땅|쇠|물)\]\]/g)) {
    if (m.index > last) out.push({ text: t.slice(last, m.index) });
    out.push({ el: ELEMENT_BY_NAME[m[1] as keyof typeof ELEMENT_BY_NAME], name: m[1] });
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}

/** 복사·요약에 쓰는 평범한 글: [[물]] → 물 */
export function plainAnswer(text: string): string {
  return text.replace(/\[\[(나무|불|땅|쇠|물)\]\]/g, "$1");
}

/** 서버 정리: 알 수 없는 [[…]] 는 안의 글만 남기고, 알약은 한 답에 3개까지만 둬요. */
export function tidyMarkup(text: string): string {
  let n = 0;
  return text.replace(/\[\[([^\]]{1,20})\]\]/g, (_m, inner: string) => {
    if (inner in ELEMENT_BY_NAME && n < 3) {
      n++;
      return `[[${inner}]]`;
    }
    return inner;
  });
}

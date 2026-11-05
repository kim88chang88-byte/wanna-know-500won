import { elementOfChar } from "@/lib/elementColor";
import type { Element } from "@/lib/saju/constants";
import type { ElementView } from "./types";

/*
 * 건강운 "오행 장부 지도". 전통 오행 대응(목=간·눈, 화=심장, 토=위, 금=폐, 수=신장)으로
 * 몸의 어느 곳을 챙기면 좋을지 생활 습관 힌트만 줘요. 병이나 증상을 알려 주는 그림이 아니에요.
 */
export type BodyEl = "목" | "화" | "토" | "금" | "수";
export type BodyState = "fill" | "rest" | "ok";

/** 그림 파일(public/images/body-map.webp) 크기. 표시 위치는 이 크기 기준 좌표예요. */
export const BODY_IMG = { w: 560, h: 1105 } as const;

export interface BodyGroup {
  el: BodyEl;
  /** 그림 옆 라벨 */
  label: string;
  area: string;
  habit: string;
  side: "L" | "R";
  /** 라벨 높이(그림 기준 y) */
  y: number;
  /** 그림 위 표시 위치 [x, y] */
  marks: [number, number][];
}

export const BODY_GROUPS: BodyGroup[] = [
  { el: "금", label: "폐", area: "호흡 · 피부", habit: "환기를 자주 하고, 자기 전 깊은 호흡 5번", side: "L", y: 370, marks: [[185, 370]] },
  { el: "목", label: "간 · 눈", area: "눈 · 간 · 근육", habit: "점심 뒤 5분 먼 곳 보기, 늦은 야식 줄이기", side: "L", y: 475, marks: [[195, 475], [203, 166], [290, 166]] },
  { el: "수", label: "신장", area: "허리 · 신장 · 수면", habit: "따뜻한 물을 하루 3번, 같은 시각에 잠자리에 들기", side: "L", y: 590, marks: [[185, 570], [315, 562]] },
  { el: "화", label: "심장", area: "심장 · 혈액순환", habit: "하루 20분 가벼운 걷기, 소리 내어 웃는 시간 만들기", side: "R", y: 370, marks: [[250, 370], [250, 595]] },
  { el: "토", label: "위", area: "소화 · 위장", habit: "식사 시간을 하루 중 같은 때로 맞추기", side: "R", y: 490, marks: [[305, 490]] },
];

export const STATE_TEXT: Record<BodyState, string> = { fill: "채워 주면 좋아요", rest: "쉬어 가며 써요", ok: "무난해요" };

/** 오행별 많고 적음으로 상태를 정해요. (적으면 채우기, 많으면 쉬어 가며 쓰기) */
export function bodyStates(elements: ElementView[]): Partial<Record<BodyEl, BodyState>> {
  const out: Partial<Record<BodyEl, BodyState>> = {};
  if (elements.length === 0) return out;
  const avg = elements.reduce((a, e) => a + e.count, 0) / elements.length;
  for (const e of elements) {
    if (!BODY_GROUPS.some((g) => g.el === e.name)) continue;
    out[e.name as BodyEl] = e.count === 0 || e.count < avg - 0.6 ? "fill" : e.count > avg + 1.2 ? "rest" : "ok";
  }
  return out;
}

const KO: Record<Element, BodyEl> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

/** 올해 세운 천간의 오행: 올해 몸에서 한 번 더 살펴볼 곳을 짚는 데 써요 */
export function yearFocus(seyunGanzhi: string | null | undefined): BodyEl | null {
  const el = elementOfChar(seyunGanzhi?.[0], false);
  return el ? KO[el] : null;
}

const RANK: Record<BodyState, number> = { fill: 0, rest: 1, ok: 2 };

/** 500원 풀이용: 챙길 곳 3가지 (채울 곳 → 쉬어 갈 곳 → 무난한 곳 순) */
export function topBodyPicks(states: Partial<Record<BodyEl, BodyState>>, max = 3): Array<{ group: BodyGroup; state: BodyState }> {
  return BODY_GROUPS.flatMap((g) => (states[g.el] ? [{ group: g, state: states[g.el] as BodyState }] : []))
    .sort((a, b) => RANK[a.state] - RANK[b.state])
    .slice(0, max);
}

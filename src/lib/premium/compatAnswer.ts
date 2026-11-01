import { josa } from "./josa";
import type { CompatPerson, CompatView } from "./types";

/*
 * 궁합 결과 맨 앞의 "도리의 답"과 오행 비교 한 줄 해석.
 * AI 를 부르지 않고 계산된 점수·팁만 엮어요. 결혼·연애를 "해도 된다/안 된다"로 단정하지 않아요.
 */

const FRAME: Record<string, string> = {
  결혼: "오래 함께할 사이로 보면",
  연인: "연인으로 보면",
  썸: "지금 알아 가는 사이로 보면",
  친구: "친구로 보면",
};

export interface CompatAnswer {
  /** 고민에서 관계 종류를 읽었는지 (못 읽으면 일반 문구) */
  hasRelation: boolean;
  body: string;
}

export function buildCompatAnswer(c: CompatView): CompatAnswer | null {
  const scores = c.scores ?? [];
  if (scores.length < 2) return null;
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const frame = (c.relation && FRAME[c.relation]) || "두 사람을 보면";
  const tips = c.tips ?? [];
  const tip = tips.find((t) => /마음 쓰면 좋은 점/.test(t.title)) ?? tips[0];
  const lines = [
    `${frame} 가장 든든한 곳은 ‘${best.label}’(${best.score}점)이에요. 반대로 ‘${worst.label}’(${worst.score}점)은 조금 더 맞춰 가면 좋아요.`,
    ...(tip ? [`이번 주엔 이렇게 해 보세요. ${tip.body}`] : []),
  ];
  return { hasRelation: Boolean(c.relation && FRAME[c.relation]), body: lines.join("\n\n") };
}

/** 두 사람 오행 막대 아래에 붙이는 한두 문장 해석 */
export function elementNote(me: CompatPerson, partner: CompatPerson, partnerName: string): string {
  const parts: string[] = [];
  const bothEmpty = me.elements.filter((e, i) => e.kind !== "unknown" && e.count === 0 && (partner.elements[i]?.count ?? 0) === 0);
  if (bothEmpty.length > 0) {
    const names = bothEmpty.map((e) => e.name).join("·");
    parts.push(`${josa(names, "은/는")} 둘 다 0이라, 함께 채워 주면 좋은 기운이에요.`);
  }
  let gapIdx = -1;
  let gap = 1;
  me.elements.forEach((e, i) => {
    if (e.kind === "unknown") return;
    const d = Math.abs(e.count - (partner.elements[i]?.count ?? 0));
    if (d > gap) {
      gap = d;
      gapIdx = i;
    }
  });
  if (gapIdx >= 0) {
    const e = me.elements[gapIdx];
    const o = partner.elements[gapIdx].count;
    parts.push(`${josa(e.name, "은/는")} 나 ${e.count}, ${partnerName} ${o}로 가장 차이가 커요. ${e.count > o ? "내가 앞서 이끌고 상대가 받쳐 주는" : "상대가 앞서 이끌고 내가 받쳐 주는"} 모습이 되기 쉬워요.`);
  }
  if (parts.length === 0) parts.push("두 사람의 오행이 비슷하게 어우러져요. 서로의 결이 닮아서 편안한 사이예요.");
  return parts.join(" ");
}

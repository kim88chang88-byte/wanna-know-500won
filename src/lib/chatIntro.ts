import { calculateSaju } from "@/lib/saju/calculate";
import { analyzeChart } from "@/lib/saju/analysis";
import { BRANCHES, STEMS, type Element } from "@/lib/saju/constants";
import type { BirthInput } from "@/lib/saju/types";
import { resolveBirth } from "@/lib/saju/birthPlace";
import type { ChatCtx } from "@/lib/chatContext";

/*
 * 상담방을 처음 열 때 도리가 먼저 건네는 "정리" 말풍선들.
 * 사주 기둥·오행은 계산으로만 만들어요. (AI 를 부르지 않아 비용이 없어요)
 */

export interface IntroPillar {
  label: string;
  hint: string;
  stem: string;
  stemKo: string;
  branchKo: string;
  branch: string;
  stemEl: Element;
  branchEl: Element;
  me: boolean;
}

export type IntroBubble =
  | { kind: "text"; text: string }
  | { kind: "pillars"; pillars: IntroPillar[] }
  | { kind: "elements"; counts: Record<Element, number> }
  | { kind: "pair"; people: { name: string; hanja: string; hangul: string; el: Element; date: string }[] };

const EL_FEEL: Record<Element, string> = {
  wood: "곧게 뻗으며 자라는 나무 같은 기운",
  fire: "주변을 밝히고 데우는 불 같은 기운",
  earth: "중심을 잡아 주는 땅 같은 기운",
  metal: "다듬고 맺고 끊는 쇠 같은 기운",
  water: "깊게 흐르며 스며드는 물 같은 기운",
};

function stemInfo(h: string) {
  return STEMS.find((s) => s.hanja === h);
}
function branchInfo(h: string) {
  return BRANCHES.find((b) => b.hanja === h);
}

function safeChart(b: BirthInput | undefined) {
  if (!b) return null;
  try {
    return calculateSaju(b);
  } catch {
    return null;
  }
}

/** 요약글의 "머리말: 내용" 한 줄을 꺼내요 */
export function pickLine(summary: string, head: string): string | null {
  const m = new RegExp(`^${head}:\\s*(.+)$`, "m").exec(summary);
  const v = m?.[1]?.trim();
  return v ? v : null;
}

function shortDate(b: BirthInput): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${b.year}.${p(b.month)}.${p(b.day)}`;
}

function chartBubbles(chart: NonNullable<ReturnType<typeof safeChart>>, who: string): IntroBubble[] {
  const out: IntroBubble[] = [];
  {
    const facts = analyzeChart(chart);
    const rows: Array<[string, string, { stem: string; branch: string } | null, boolean]> = [
      ["시주", "태어난 시", chart.hour, false],
      ["일주", "나", chart.day, true],
      ["월주", "태어난 달", chart.month, false],
      ["연주", "태어난 해", chart.year, false],
    ];
    const pillars: IntroPillar[] = [];
    for (const [label, hint, p, me] of rows) {
      if (!p) continue;
      const s = stemInfo(p.stem);
      const b = branchInfo(p.branch);
      if (!s || !b) continue;
      pillars.push({ label, hint, stemKo: s.hangul, branchKo: b.hangul, stem: p.stem, branch: p.branch, stemEl: s.element, branchEl: b.element, me });
    }
    out.push({ kind: "text", text: `먼저 ${who}의 사주 기둥이야.${facts.hourKnown ? "" : " (태어난 시각은 몰라서 세 기둥만 봤어)"}` });
    out.push({ kind: "pillars", pillars });
    const dm = facts.dayMaster;
    out.push({ kind: "text", text: `태어난 날의 기운(일간)은 **${dm.hangul}${dm.elementKo.replace(/\(.+\)/, "")}**, ${EL_FEEL[dm.element]}이야.` });
    out.push({ kind: "elements", counts: facts.elementCounts });
  }
  return out;
}

/** 첫 인사 다음에 이어서 보여 줄 말풍선들. 보여 줄 게 없으면 빈 배열이에요. */
export function buildIntro(ctx: ChatCtx): IntroBubble[] {
  const out: IntroBubble[] = [];
  const who = ctx.name?.trim() ? `${ctx.name.trim()}님` : "너";

  if (ctx.kind === "daily") {
    // 저장된 내 정보가 넘어오면, 서버가 풀이에 쓰는 것과 같은 보정(출생지 경도)을 거쳐 사주 기둥부터 보여 줘요.
    let mine = null;
    try {
      mine = ctx.birth ? safeChart(resolveBirth(ctx.birth).input) : null;
    } catch {
      mine = null;
    }
    if (mine) out.push(...chartBubbles(mine, who));
    const ganzhi = pickLine(ctx.summary, "오늘 일진");
    const line = pickLine(ctx.summary, "오늘의 한마디");
    const tip = pickLine(ctx.summary, "오늘의 팁");
    if (ganzhi) out.push({ kind: "text", text: `오늘 일진은 **${ganzhi}**일이야.` });
    if (line) out.push({ kind: "text", text: `오늘의 한마디는 **${line.slice(0, 80)}**이었어.` });
    if (tip) out.push({ kind: "text", text: `같이 받은 팁은 "${tip.slice(0, 80)}"! 여기서 더 풀어 볼까?` });
    return out;
  }

  const chart = safeChart(ctx.birth);

  if (ctx.kind === "compat") {
    const other = safeChart(ctx.partnerBirth);
    if (chart && other && ctx.birth && ctx.partnerBirth) {
      const a = analyzeChart(chart).dayMaster;
      const b = analyzeChart(other).dayMaster;
      out.push({
        kind: "pair",
        people: [
          { name: ctx.name?.trim() || "나", hanja: a.hanja, hangul: a.hangul, el: a.element, date: shortDate(ctx.birth) },
          { name: ctx.partnerName?.trim() || "상대", hanja: b.hanja, hangul: b.hangul, el: b.element, date: shortDate(ctx.partnerBirth) },
        ],
      });
    }
    const score = pickLine(ctx.summary, "궁합 점수");
    const head = pickLine(ctx.summary, "궁합 한 줄");
    if (score) out.push({ kind: "text", text: `궁합 점수는 **${score}**이었어.` });
    if (head) out.push({ kind: "text", text: `결과서의 핵심은 **${head.slice(0, 80)}**이었지.` });
    return out;
  }

  // 풀이(500원·프리미엄)
  if (chart) out.push(...chartBubbles(chart, who));
  const concern = pickLine(ctx.summary, "고민");
  const head = pickLine(ctx.summary, "한 줄 결론");
  if (concern) out.push({ kind: "text", text: `적어 준 고민은 **${concern.slice(0, 60)}**이었지.` });
  if (head && ctx.topic !== "study") out.push({ kind: "text", text: `풀이의 핵심은 **${head.slice(0, 80)}**이었어.` });
  return out;
}

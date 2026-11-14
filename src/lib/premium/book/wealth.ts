import type { SajuResult } from "ssaju";
import { STEMS } from "@/lib/saju/constants";
import { groupOf, type Group } from "../topic";
import type { BookRow, BookTable } from "../types";
import type { PosKey } from "./insight";
import { buildMonthTimeline, monthEvidence, type MonthPlan } from "./timeline";

/*
 * 지금부터 12개월 재물 달력. 월운이 원국과 만나는 모습(합충·용신)에 "재물 기운(재성)이 들어오는지"를 더해 달마다 0~100 상대 지수와 한 줄 이름을 붙여요.
 * 코드로만 계산해요(AI 호출 없음). 지수는 흐름의 높낮이를 보는 참고용이고, 실제 수입이나 투자 결과를 말하는 것이 아니에요.
 */

export const WEALTH_CALENDAR_TITLE = "재물 달력";

const EL_KO: Record<string, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

function yongsinEls(r: SajuResult): string[] {
  return [...new Set(r.advanced.yongsin.map((y) => EL_KO[STEMS.find((s) => s.hanja === y)?.element ?? ""] ?? "").filter(Boolean))];
}

export function wealthScore(p: MonthPlan): number {
  const s = groupOf(p.stemGod);
  const b = groupOf(p.branchGod);
  let v = p.score;
  if (s === "재성") v += 20;
  else if (s === "식상") v += 5;
  else if (s === "비겁") v -= 8;
  if (b === "재성") v += 10;
  else if (b === "비겁") v -= 4;
  return Math.round(Math.max(20, Math.min(95, v)));
}

const LABEL: Record<Group, [string, string]> = {
  재성: ["재물이 열리는 달", "실속을 챙기는 달"],
  식상: ["재능을 돈으로 잇는 달", "아이디어를 꺼내는 달"],
  관성: ["계약과 책임을 다지는 달", "역할을 정리하는 달"],
  인성: ["문서와 배움을 점검하는 달", "안쪽을 채우는 달"],
  비겁: ["지출을 단속하는 달", "나눌 몫을 정하는 달"],
};

export function wealthLabel(p: MonthPlan, score: number): string {
  const g = groupOf(p.stemGod) ?? groupOf(p.branchGod) ?? "비겁";
  return LABEL[g][score >= 70 ? 0 : 1];
}

export function buildWealthCalendar(r: SajuResult, hourUnknown: boolean, now: Date): BookTable | null {
  const natal: Partial<Record<PosKey, string>> = { year: r.pillars.year, month: r.pillars.month, day: r.pillars.day };
  if (!hourUnknown) natal.hour = r.pillars.hour;
  const plans = buildMonthTimeline({ natal, dayStem: r.dayStem, yongsinEls: yongsinEls(r), now, count: 12 });
  if (plans.length === 0) return null;
  const rows: BookRow[] = plans.map((p) => {
    const score = wealthScore(p);
    return {
      label: `'${String(p.year).slice(2)} ${p.month}월`,
      value: wealthLabel(p, score),
      note: monthEvidence(p),
      bar: score,
      highlight: score >= 75,
      current: p.index === 0,
    };
  });
  return { title: WEALTH_CALENDAR_TITLE, rows };
}

import type { SajuChart } from "@/lib/saju/types";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { branchRelation } from "@/lib/ai/dailyFacts";
import { EL_KO, type Element } from "@/lib/ai/menuHobby";
import { findSals, SAL_NAME } from "@/lib/premium/book/sinsalCombo";

/*
 * 연애 질문일 때만 프롬프트에 넣는 "연애 재료". 오행(땅·불)만 반복하지 않고,
 * 배우자 자리(일지)·도화·올해/내년 세운과 일지의 관계처럼 연애에 맞는 근거를 한 가지 고르게 해요.
 */

export const LOVE_Q = /연애|사랑|애인|남친|여친|남자친구|여자친구|썸|짝사랑|고백|이별|헤어|재회|전남친|전여친|결혼|소개팅|바람|권태|장거리|궁합|좋아하는\s?사람|연락/;

const REL_TEXT: Record<"합" | "충" | "해", string> = {
  합: "합 — 인연이 부드럽게 붙는 흐름",
  충: "충 — 관계에 움직임·변화가 생기기 쉬운 흐름(나쁘다고 단정 금지)",
  해: "해 — 사소한 엇박자가 신경 쓰이기 쉬운 흐름",
};

/** 입춘(2월 4일) 전이면 아직 지난해 세운이에요 */
export function sewoonBranch(now: Date): { year: number; branch: string } {
  const k = new Date(now.getTime() + 9 * 3600_000);
  let y = k.getUTCFullYear();
  if (k.getUTCMonth() < 1 || (k.getUTCMonth() === 1 && k.getUTCDate() < 4)) y -= 1;
  return { year: y, branch: BRANCHES[(((y - 4) % 12) + 12) % 12].hanja };
}

export function loveFacts(chart: SajuChart, now: Date): Record<string, unknown> {
  const dayB = chart.day.branch;
  const dayInfo = BRANCHES.find((b) => b.hanja === dayB);
  const out: Record<string, unknown> = {
    배우자자리: `일지 ${dayB}(${dayInfo?.hangul ?? ""}) ${dayInfo ? EL_KO[dayInfo.element as Element] : ""}`,
  };
  const pillars = {
    year: `${chart.year.stem}${chart.year.branch}`,
    month: `${chart.month.stem}${chart.month.branch}`,
    day: `${chart.day.stem}${chart.day.branch}`,
    hour: chart.hour ? `${chart.hour.stem}${chart.hour.branch}` : "",
  };
  const stem = STEMS.find((s) => s.hanja === chart.day.stem);
  const found = findSals({ pillars, dayStem: chart.day.stem } as never, !chart.hour);
  const dohwa = found.get("도화");
  out.도화 = dohwa ? `있음(${dohwa.map((p) => ({ year: "연주", month: "월주", day: "일주", hour: "시주" })[p]).join("·")}) — ${SAL_NAME["도화"].name}은 사람을 끄는 매력·인연이 많은 결` : "두드러지지 않음";
  const sw = sewoonBranch(now);
  const next = BRANCHES[(BRANCHES.findIndex((b) => b.hanja === sw.branch) + 1) % 12].hanja;
  const rel = (b: string) => {
    const r = branchRelation(b, dayB);
    return r ? REL_TEXT[r] : "특별한 합·충 없음(잔잔한 해)";
  };
  out.올해세운과배우자자리 = `${sw.year}년 ${sw.branch} ↔ 일지 ${dayB}: ${rel(sw.branch)}`;
  out.내년세운과배우자자리 = `${sw.year + 1}년 ${next} ↔ 일지 ${dayB}: ${rel(next)}`;
  const endOfYear = Math.max(0, Math.ceil((Date.UTC(new Date(now.getTime() + 9 * 3600_000).getUTCFullYear(), 11, 31) - (now.getTime() + 9 * 3600_000)) / (7 * 24 * 3600_000)));
  out.올해남은기간 = `약 ${endOfYear}주`;
  if (stem) out.일간 = `${stem.hangul}(${EL_KO[stem.element as Element]})`;
  return out;
}

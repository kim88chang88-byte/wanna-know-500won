import type { BirthInput } from "@/lib/saju/types";
import { buildCoreFacts } from "@/lib/ai/coreFacts";

/*
 * "내년 2월에 이사 가", "2027년 3월 계약" 처럼 앞으로의 시점이 들어 있는 질문에는
 * 그 시점 기준의 세운·월운·원국 관계를 따로 계산해서 줘요. (지금 기준 재료만 있으면 "내년 초에 변화가 있어" 정도로 흐려져요.)
 */

const FUTURE_WORD = /내년|다음\s?해|20\d\d\s?년|(\d{1,2})\s?월/;

/** 질문 속 시점을 날짜로 바꿔요. 지금보다 보름 이상 뒤일 때만 돌려줘요. */
export function futureDate(question: string, now: Date): { date: Date; label: string } | null {
  if (!FUTURE_WORD.test(question)) return null;
  const k = new Date(now.getTime() + 9 * 3600_000);
  const cy = k.getUTCFullYear();
  const cm = k.getUTCMonth() + 1;
  const ym = question.match(/(20\d\d)\s?년/);
  const mm = question.match(/(\d{1,2})\s?월(?!\s?[0-9]*\s?(?:일|급))/);
  let year = ym ? Number(ym[1]) : /내년|다음\s?해/.test(question) ? cy + 1 : cy;
  let month = mm ? Number(mm[1]) : 0;
  if (month < 1 || month > 12) month = year > cy ? 2 : 0;
  if (!ym && !/내년|다음\s?해/.test(question) && month > 0 && month < cm) year = cy + 1; // "3월에"가 이미 지난 달이면 다가오는 해로 봐요
  if (month === 0) return null;
  const date = new Date(`${year}-${String(month).padStart(2, "0")}-15T12:00:00+09:00`);
  if (date.getTime() - now.getTime() < 15 * 24 * 3600_000) return null;
  if (year > cy + 3) return null;
  return { date, label: `${year}년 ${month}월경` };
}

export function futureFacts(birth: BirthInput, question: string, now: Date): Record<string, unknown> | null {
  const t = futureDate(question, now);
  if (!t) return null;
  const c = buildCoreFacts(birth, t.date, false);
  if (!c) return null;
  const out: Record<string, unknown> = { 시점: t.label };
  if (c.올해세운) out.그해세운 = c.올해세운;
  if (c.세운과원국) out.세운과원국 = c.세운과원국;
  if (c.지금대운) out.그때대운 = c.지금대운;
  if (c.대운과원국) out.대운과원국 = c.대운과원국;
  if (c.이번달월운) out.그달월운 = c.이번달월운;
  return out;
}

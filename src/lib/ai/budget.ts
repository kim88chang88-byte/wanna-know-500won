import { kstDay } from "@/lib/db/kst";

/**
 * AI 비용 방어: 서버 전체에서 하루에 부를 수 있는 AI 호출 수(AI_DAILY_CAP)와 비상 차단(AI_DISABLED).
 * 한도를 넘으면 AI 한마디만 빼고 사주 리포트는 그대로 나가요. (키가 없을 때와 같은 모습)
 * 하루 기준은 한국 시간(KST)이에요. 호출 한 번 = 이용자의 뽑기 한 번 (형식이 어긋나 한 번 더 부르는 재시도는 따로 세지 않아요.
 * 그래서 실제 호출 수는 한도의 최대 2배까지 갈 수 있어요).
 */
export const DEFAULT_AI_DAILY_CAP = 300;

export type BudgetResult = "ok" | "disabled" | "cap";

export function isAiDisabled(env: Record<string, string | undefined>): boolean {
  const v = env.AI_DISABLED?.trim().toLowerCase();
  return v === "true" || v === "1";
}

/** 음이 아닌 정수만 받아요. 비었거나 이상하면 기본값. (0 이면 AI 를 아예 안 불러요) */
export function parseAiDailyCap(env: Record<string, string | undefined>): number {
  const raw = env.AI_DAILY_CAP?.trim();
  if (!raw || !/^\d{1,7}$/.test(raw)) return DEFAULT_AI_DAILY_CAP;
  return Number(raw);
}

/** DB 가 없거나 잠깐 안 될 때 쓰는 인스턴스별 임시 카운터예요. (서버가 여러 개면 느슨하지만, 무제한은 아니에요) */
const memory = { day: "", calls: 0 };

export function takeFromMemory(cap: number, now: Date = new Date()): boolean {
  const day = kstDay(now);
  if (memory.day !== day) {
    memory.day = day;
    memory.calls = 0;
  }
  if (memory.calls >= cap) return false;
  memory.calls += 1;
  return true;
}

export function resetMemoryBudget(): void {
  memory.day = "";
  memory.calls = 0;
}

interface BudgetDb {
  takeAiBudget(day: string, cap: number): Promise<boolean>;
}

/** AI 를 불러도 되는지 확인하고, 되면 한 번 쓴 것으로 적어요. */
export async function takeAiBudget(env: Record<string, string | undefined>, db: BudgetDb | null, now: Date = new Date()): Promise<BudgetResult> {
  if (isAiDisabled(env)) return "disabled";
  const cap = parseAiDailyCap(env);
  if (cap === 0) return "cap";
  if (db) {
    try {
      return (await db.takeAiBudget(kstDay(now), cap)) ? "ok" : "cap";
    } catch (err) {
      console.error("takeAiBudget failed:", err instanceof Error ? err.message : "unknown");
    }
  }
  return takeFromMemory(cap, now) ? "ok" : "cap";
}

import { createHash } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { kstDay } from "@/lib/db/kst";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

/**
 * AI 비용 점검 도구.
 *  1) 관리자 테스트 캐시: 관리자 요청에서만 켜져요. 같은 모델·프롬프트·입력이면 저장해 둔 결과를 다시 써서 AI 를 안 불러요.
 *  2) 호출 기록: 실제로 부른 횟수와 토큰을 날짜·모델별로 DB(ai_cost)에 적어요. (관리자 화면에서 확인)
 * DB 가 없거나 표를 안 만들었으면 둘 다 조용히 건너뛰어요. (사이트 동작에는 영향 없어요)
 */

const als = new AsyncLocalStorage<{ cache: boolean }>();

/** 이 요청(과 거기서 이어지는 AI 호출)에 관리자 테스트 캐시를 켜요. 관리자 확인 뒤에만 부르세요. */
export function enableAdminAiCache(): void {
  als.enterWith({ cache: true });
}

export function adminCacheOn(): boolean {
  return als.getStore()?.cache === true;
}

export function aiCacheKey(model: string, system: string, user: string, schema: object, maxTokens: number): string {
  return createHash("sha256").update(JSON.stringify([model, system, user, schema, maxTokens])).digest("hex");
}

function dbOrNull(env: Record<string, string | undefined> = process.env) {
  const cfg = loadDbConfig(env);
  return cfg ? createDb(cfg) : null;
}

export async function readAiCache(key: string): Promise<string | null> {
  const db = dbOrNull();
  if (!db) return null;
  try {
    return await db.getAiCache(key);
  } catch {
    return null;
  }
}

export async function writeAiCache(key: string, model: string, payload: string): Promise<void> {
  const db = dbOrNull();
  if (!db) return;
  try {
    await db.putAiCache(key, model, payload);
  } catch {
    /* 캐시 표가 없으면 건너뛰어요 */
  }
}

/** 실제 호출(usage 있음) 또는 캐시 적중(hit)을 기록해요. 실패해도 풀이에는 영향 없어요. */
export async function logAiCall(model: string, o: { usage?: { input: number; output: number }; hit?: boolean }): Promise<void> {
  const db = dbOrNull();
  if (!db) return;
  try {
    await db.addAiCost(kstDay(new Date()), model, o.hit ? 0 : 1, o.hit ? 1 : 0, o.usage?.input ?? 0, o.usage?.output ?? 0);
  } catch {
    /* 기록 표가 없으면 건너뛰어요 */
  }
}

/**
 * 100만 토큰당 대략 단가(달러). 공식 단가와 다를 수 있으니, 정확한 금액은 각 콘솔의 Billing 을 보세요.
 * 단가가 바뀌면 이 표만 고치면 돼요.
 */
const PRICE_USD_PER_M: Array<{ match: RegExp; input: number; output: number }> = [
  { match: /gemini.*flash-lite/i, input: 0.1, output: 0.4 },
  { match: /gemini/i, input: 0.3, output: 2.5 },
  { match: /haiku/i, input: 1, output: 5 },
  { match: /sonnet/i, input: 3, output: 15 },
  { match: /opus/i, input: 5, output: 25 },
];
export const KRW_PER_USD = 1400;

/** 대략의 원화 비용. 단가를 모르는 모델은 null. */
export function estimateKrw(model: string, input: number, output: number): number | null {
  const p = PRICE_USD_PER_M.find((x) => x.match.test(model));
  if (!p) return null;
  return ((input * p.input + output * p.output) / 1_000_000) * KRW_PER_USD;
}

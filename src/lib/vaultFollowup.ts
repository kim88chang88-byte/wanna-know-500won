import { kstDay } from "@/lib/db/kst";
import { realityCheck, type RealityKind } from "@/lib/premium/book/reality";
import type { StorageLike } from "./drawCounter";

/*
 * 지난 풀이 후속 질문. 보관함에 있는 풀이 중 며칠 지난 것을 골라 "지금 내 모습과 견주면 어때요?" 하고 한 번만 물어봐요.
 * 대답한 풀이 번호만 이 기기에 기억해요. (서버에 보내지 않아요)
 */

export const VAULT_FOLLOWUP_KEY = "wanna500:vault-followup:v1";
export const ASK_AFTER_DAYS = 3;
export const ASK_UNTIL_DAYS = 60;
const MAX_REMEMBERED = 200;

export interface VaultRowLite {
  id: string;
  topic: string;
  premium?: boolean;
  created_at: string;
}

const KIND_BY_TOPIC: Record<string, RealityKind> = {
  love: "love",
  marriage: "love",
  money: "money",
  success: "career",
  health: "health",
  study: "study",
  general: "flow",
};

const TOPIC_NAME: Record<string, string> = { love: "연애운", marriage: "결혼운", money: "재물운", success: "성공운", health: "건강운", study: "학업운", general: "종합운" };

const dayNum = (d: string): number => {
  const [y, m, dd] = d.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, dd) / 86_400_000);
};

export interface FollowupPick {
  id: string;
  topicName: string;
  daysAgo: number;
  kind: RealityKind;
}

/** 아직 대답하지 않은 가장 최근 풀이 하나. 3일~60일 사이만 물어요. (rows 는 최신순이어도 아니어도 돼요) */
export function pickVaultFollowup(rows: VaultRowLite[], now: Date, answered: string[]): FollowupPick | null {
  const today = dayNum(kstDay(now));
  const done = new Set(answered);
  let best: (FollowupPick & { n: number }) | null = null;
  for (const r of rows) {
    if (done.has(r.id)) continue;
    const t = new Date(r.created_at);
    if (Number.isNaN(t.getTime())) continue;
    const n = dayNum(kstDay(t));
    const ago = today - n;
    if (ago < ASK_AFTER_DAYS || ago > ASK_UNTIL_DAYS) continue;
    if (!best || n > best.n) best = { id: r.id, topicName: TOPIC_NAME[r.topic] ?? "종합운", daysAgo: ago, kind: KIND_BY_TOPIC[r.topic] ?? "flow", n };
  }
  if (!best) return null;
  const { n: _n, ...pick } = best;
  return pick;
}

export function followupPrompt(p: FollowupPick) {
  return { title: `${p.daysAgo}일 전에 본 ‘${p.topicName}’ 풀이, 요즘은 어때요?`, check: realityCheck(p.kind) };
}

export function readAnswered(storage: StorageLike | null): string[] {
  if (!storage) return [];
  try {
    const v = JSON.parse(storage.getItem(VAULT_FOLLOWUP_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(-MAX_REMEMBERED) : [];
  } catch {
    return [];
  }
}

export function markAnswered(storage: StorageLike | null, id: string): void {
  if (!storage) return;
  try {
    const cur = readAnswered(storage);
    if (!cur.includes(id)) storage.setItem(VAULT_FOLLOWUP_KEY, JSON.stringify([...cur, id].slice(-MAX_REMEMBERED)));
  } catch {
    /* 저장 실패는 무시 */
  }
}

import { kstDay } from "@/lib/db/kst";

/** 보관함에 모인 풀이를 세어요. 이번 달(한국 시간) 개수와 주제별 개수, 전체 개수. */

const TOPIC_NAME: Record<string, string> = { love: "연애운", marriage: "결혼운", money: "재물운", success: "성공운", health: "건강운", study: "학업운", general: "종합운" };

export interface VaultSummary {
  total: number;
  month: number;
  /** 이번 달 주제별 (많은 순, 같으면 이름 순) */
  byTopic: Array<{ name: string; n: number }>;
}

export function summarizeVault(rows: Array<{ topic: string; created_at: string }>, now: Date): VaultSummary {
  const ym = kstDay(now).slice(0, 7);
  const counts = new Map<string, number>();
  let month = 0;
  for (const r of rows) {
    const t = new Date(r.created_at);
    if (Number.isNaN(t.getTime()) || kstDay(t).slice(0, 7) !== ym) continue;
    month++;
    const name = TOPIC_NAME[r.topic] ?? "종합운";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const byTopic = [...counts].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "ko"));
  return { total: rows.length, month, byTopic };
}

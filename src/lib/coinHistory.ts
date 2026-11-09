import { DEMO_KIND } from "./demoBuy";
import { REWARD_KIND } from "./reviewReward";

/* 지갑의 "최근 내역": coin_log 줄을 사람이 읽는 한 줄씩으로 묶어요. (개인정보 없이 종류·개수·시각만) */

export interface CoinLogRow {
  kind: string;
  delta: number;
  created_at: string;
}
export interface HistoryItem {
  label: string;
  /** 조약돌 개수 변화 (+지급 / -사용) */
  delta: number;
  at: string;
}

const GROUP_MS = 20_000;
export const HISTORY_LIMIT = 20;

function kindLabel(kind: string, delta: number): string {
  if (kind === DEMO_KIND || kind === `${DEMO_KIND}_more`) return "베타 체험 구매";
  if (kind === REWARD_KIND) return "정성 후기";
  if (kind === "referral_join") return "친구 초대 (초대받음)";
  if (kind === "referral_invite") return "친구 초대";
  if (kind === "chat_buy") return "도유 상담실 질문 더하기";
  if (kind === "spend") {
    const n = Math.abs(delta);
    return n === 1 ? "일반 풀이" : n === 2 ? "둘의 궁합" : n === 19 ? "프리미엄 종합 사주" : "풀이";
  }
  return delta >= 0 ? "조약돌 받음" : "조약돌 사용";
}

/**
 * 최신순 coin_log 줄들을 한 줄씩으로 묶어요.
 * 프리미엄(조약돌 19개)은 줄이 19개로 남아서, 같은 종류·같은 방향으로 20초 안에 이어진 줄은 하나로 합쳐요.
 * delta 0 (가입 표시)은 건너뛰어요.
 */
export function groupCoinLog(rows: CoinLogRow[], limit = HISTORY_LIMIT): HistoryItem[] {
  const out: Array<{ key: string; kind: string; delta: number; at: string; ms: number }> = [];
  for (const r of rows) {
    if (!r || typeof r.delta !== "number" || !Number.isFinite(r.delta) || r.delta === 0) continue;
    const ms = Date.parse(r.created_at);
    if (!Number.isFinite(ms)) continue;
    const base = r.kind.replace(/_more$/, "");
    const key = `${base}|${r.delta > 0 ? "+" : "-"}`;
    const prev = out[out.length - 1];
    if (prev && prev.key === key && Math.abs(prev.ms - ms) <= GROUP_MS) {
      prev.delta += r.delta;
      prev.ms = ms;
      continue;
    }
    out.push({ key, kind: r.kind, delta: r.delta, at: r.created_at, ms });
  }
  return out.slice(0, limit).map((g) => ({ label: kindLabel(g.kind, g.delta), delta: g.delta, at: g.at }));
}

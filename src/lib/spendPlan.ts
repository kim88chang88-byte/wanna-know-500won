/*
 * "풀이 보기"를 누르면 무엇이 쓰이는지: 무료 뽑기 → 보너스 뽑기권 → 동전 순서예요.
 * 화면은 이 결과로 "계속하시겠어요?" 확인창을 보여줘요. (서버의 차감 순서와 같아요)
 */
/** 프리미엄 종합 사주(9,500원)를 열 때 쓰는 동전 수 (500원 = 동전 1개) */
export const PREMIUM_COINS = 19;

/** 풀이 한 번에 드는 동전 수: 일반 1개, 둘의 궁합 2개, 프리미엄 종합 사주 19개 */
export function readingCoinCost(premium: boolean, compat: boolean): number {
  return premium ? (compat ? 2 : PREMIUM_COINS) : 1;
}

export interface SpendWallet {
  /** 오늘 남은 무료 뽑기 횟수 */
  freeLeft: number;
  /** 보너스 뽑기권 장수 */
  tickets: number;
  /** 동전(500원) 개수 */
  coins: number;
}

export type SpendPlan =
  | { kind: "free"; before: number; after: number }
  | { kind: "ticket"; before: number; after: number }
  | { kind: "coin"; cost: number; before: number; after: number }
  | { kind: "short"; cost: number; have: number };

export function spendPlan(w: SpendWallet, cost: number): SpendPlan {
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  const free = n(w.freeLeft);
  const tickets = n(w.tickets);
  const coins = n(w.coins);
  const c = Math.max(1, Math.floor(cost));
  if (free > 0) return { kind: "free", before: free, after: free - 1 };
  if (tickets > 0) return { kind: "ticket", before: tickets, after: tickets - 1 };
  if (coins >= c) return { kind: "coin", cost: c, before: coins, after: coins - c };
  return { kind: "short", cost: c, have: coins };
}

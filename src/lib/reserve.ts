/*
 * 풀이 비용 "먼저 차감(예약) → 풀이 → 실패하면 되돌리기".
 * 풀이를 만든 뒤에 차감하면 같은 요청을 동시에 여러 번 보냈을 때 모두 통과하므로, 풀이 전에 DB 에서 한 번에 확인·차감해요.
 * DB 함수(coin_spend_n·coin_refund·draw_take·draw_cancel)가 아직 없으면(HTTP 404) 옛 방식(풀이 뒤 차감)으로 돌아가요.
 */
export interface ReserveDb {
  spendCoins(userId: string, cost: number, ref: string): Promise<number>;
  refundCoins(userId: string, ref: string): Promise<number>;
  takeDraw(userId: string, topic: string, limit: number | null): Promise<number>;
  cancelDraw(userId: string, id: number): Promise<void>;
}

export type Reservation =
  | { kind: "none" } // 예약하지 않음 (DB 오류 등으로 무료 뽑기를 건너뛰는 경우)
  | { kind: "legacy" } // DB 함수가 아직 없어서 옛 방식(풀이 뒤 차감)
  | { kind: "coin"; ref: string; cost: number }
  | { kind: "draw"; id: number };

export type ReserveResult = { ok: true; reservation: Reservation } | { ok: false; reason: "short" | "error" };

const missing = (err: unknown): boolean => err instanceof Error && err.message === "HTTP 404";

/** 주문 번호: 같은 요청의 차감과 환불을 짝지어요 */
export function newReserveRef(now: number = Date.now(), rand: () => number = Math.random): string {
  return `r${now.toString(36)}${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, "0")}`;
}

/** 조약돌을 풀이 전에 먼저 써요. 모자라면 short, DB 가 안 되면 error(유료라서 막아요) */
export async function reserveCoins(db: ReserveDb, userId: string, cost: number, ref: string = newReserveRef()): Promise<ReserveResult> {
  try {
    const left = await db.spendCoins(userId, cost, ref);
    return left >= 0 ? { ok: true, reservation: { kind: "coin", ref, cost } } : { ok: false, reason: "short" };
  } catch (err) {
    if (missing(err)) return { ok: true, reservation: { kind: "legacy" } };
    return { ok: false, reason: "error" };
  }
}

/** 오늘 무료 뽑기 자리를 잡아요. limit 이 null 이면 한도 없이 기록만. 한도가 차 있으면 short, DB 오류는 건너뛰어요(무료라서) */
export async function reserveDraw(db: ReserveDb, userId: string, topic: string, limit: number | null): Promise<ReserveResult> {
  try {
    const id = await db.takeDraw(userId, topic, limit);
    return id >= 0 ? { ok: true, reservation: { kind: "draw", id } } : { ok: false, reason: "short" };
  } catch (err) {
    return { ok: true, reservation: { kind: missing(err) ? "legacy" : "none" } };
  }
}

/** 풀이가 실패했을 때 예약을 되돌려요. 실패해도 풀이 응답엔 영향 없어요 */
export async function releaseReservation(db: ReserveDb, userId: string, r: Reservation): Promise<void> {
  try {
    if (r.kind === "coin") await db.refundCoins(userId, r.ref);
    else if (r.kind === "draw") await db.cancelDraw(userId, r.id);
  } catch (err) {
    console.error("release reservation failed:", err instanceof Error ? err.message : "unknown");
  }
}

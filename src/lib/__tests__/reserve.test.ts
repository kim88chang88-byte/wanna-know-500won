import { describe, expect, it } from "vitest";
import { newReserveRef, releaseReservation, reserveCoins, reserveDraw, type ReserveDb } from "../reserve";
import { userCapFor } from "../userAiCap";

/** DB 함수처럼 한 번에 확인·차감하는 가짜 DB */
function fakeDb(balance: number, drawsToday = 0) {
  const state = { balance, spends: new Map<string, number>(), refunded: new Set<string>(), draws: new Set<number>(), next: 1, drawsToday };
  const db: ReserveDb = {
    async spendCoins(_u, cost, ref) {
      if (state.balance < cost) return -1;
      state.balance -= cost;
      state.spends.set(ref, cost);
      return state.balance;
    },
    async refundCoins(_u, ref) {
      const cost = state.spends.get(ref);
      if (!cost || state.refunded.has(ref)) return -1;
      state.refunded.add(ref);
      state.balance += cost;
      return state.balance;
    },
    async takeDraw(_u, _t, limit) {
      if (limit !== null && state.drawsToday + state.draws.size >= limit) return -1;
      const id = state.next++;
      state.draws.add(id);
      return id;
    },
    async cancelDraw(_u, id) {
      state.draws.delete(id);
    },
  };
  return { db, state };
}

describe("먼저 차감하기", () => {
  it("조약돌 1개로 같은 요청을 10번 동시에 보내도 1번만 통과해요", async () => {
    const { db, state } = fakeDb(1);
    const results = await Promise.all(Array.from({ length: 10 }, () => reserveCoins(db, "u1", 1)));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.reason === "short")).toHaveLength(9);
    expect(state.balance).toBe(0);
  });

  it("프리미엄(19개)은 한 번에 차감하고, 실패하면 같은 주문으로 한 번만 돌려줘요", async () => {
    const { db, state } = fakeDb(22);
    const r = await reserveCoins(db, "u1", 19);
    expect(r.ok && r.reservation.kind).toBe("coin");
    expect(state.balance).toBe(3);
    if (!r.ok) throw new Error("unreachable");
    await releaseReservation(db, "u1", r.reservation);
    await releaseReservation(db, "u1", r.reservation); // 두 번 눌러도
    expect(state.balance).toBe(22);
  });

  it("잔액이 모자라면 short, DB 오류는 error(유료라 막음), 함수가 없으면(404) 옛 방식", async () => {
    expect(await reserveCoins(fakeDb(0).db, "u", 1)).toEqual({ ok: false, reason: "short" });
    const boom = (msg: string): ReserveDb => ({ ...fakeDb(5).db, spendCoins: async () => { throw new Error(msg); } });
    expect(await reserveCoins(boom("network"), "u", 1)).toEqual({ ok: false, reason: "error" });
    expect(await reserveCoins(boom("HTTP 404"), "u", 1)).toEqual({ ok: true, reservation: { kind: "legacy" } });
  });

  it("무료 뽑기: 한도가 1이면 동시에 5번 보내도 1번만, 실패하면 자리를 돌려줘요", async () => {
    const { db, state } = fakeDb(0);
    const results = await Promise.all(Array.from({ length: 5 }, () => reserveDraw(db, "u1", "general", 1)));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const ok = results.find((r) => r.ok);
    if (!ok || !ok.ok) throw new Error("unreachable");
    await releaseReservation(db, "u1", ok.reservation);
    expect(state.draws.size).toBe(0);
    expect((await reserveDraw(db, "u1", "general", 1)).ok).toBe(true);
  });

  it("무료 뽑기: 한도 없이(베타) 기록만 하거나, DB 가 안 될 땐 건너뛰어요", async () => {
    const { db } = fakeDb(0, 99);
    expect((await reserveDraw(db, "u", "general", null)).ok).toBe(true);
    const down: ReserveDb = { ...db, takeDraw: async () => { throw new Error("network"); } };
    expect(await reserveDraw(down, "u", "general", 1)).toEqual({ ok: true, reservation: { kind: "none" } });
  });

  it("주문 번호는 매번 달라요", () => {
    expect(newReserveRef(1, () => 0.1)).not.toBe(newReserveRef(1, () => 0.2));
    expect(newReserveRef().length).toBeLessThanOrEqual(80);
  });
});

describe("회원별 하루 상한 설정", () => {
  it("기본값 30·8, 환경변수로 바꾸고, 이상한 값은 무시해요", () => {
    expect(userCapFor("normal", {})).toBe(30);
    expect(userCapFor("premium", {})).toBe(8);
    expect(userCapFor("normal", { AI_USER_DAY_CAP: "50" })).toBe(50);
    expect(userCapFor("premium", { AI_USER_PREMIUM_DAY_CAP: "0" })).toBe(8);
    expect(userCapFor("normal", { AI_USER_DAY_CAP: "abc" })).toBe(30);
  });
});

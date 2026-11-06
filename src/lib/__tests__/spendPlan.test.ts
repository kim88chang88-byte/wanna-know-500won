import { describe, expect, it } from "vitest";
import { spendPlan } from "../spendPlan";

describe("spendPlan", () => {
  it("무료가 있으면 무료가 먼저예요", () => {
    expect(spendPlan({ freeLeft: 1, tickets: 3, coins: 10 }, 1)).toEqual({ kind: "free", before: 1, after: 0 });
  });
  it("무료가 없고 보너스 뽑기권이 있으면 뽑기권을 써요", () => {
    expect(spendPlan({ freeLeft: 0, tickets: 3, coins: 10 }, 1)).toEqual({ kind: "ticket", before: 3, after: 2 });
  });
  it("그다음은 동전이에요", () => {
    expect(spendPlan({ freeLeft: 0, tickets: 0, coins: 10 }, 1)).toEqual({ kind: "coin", cost: 1, before: 10, after: 9 });
    expect(spendPlan({ freeLeft: 0, tickets: 0, coins: 5 }, 2)).toEqual({ kind: "coin", cost: 2, before: 5, after: 3 });
  });
  it("동전이 모자라면 short", () => {
    expect(spendPlan({ freeLeft: 0, tickets: 0, coins: 1 }, 2)).toEqual({ kind: "short", cost: 2, have: 1 });
    expect(spendPlan({ freeLeft: 0, tickets: 0, coins: 0 }, 1)).toEqual({ kind: "short", cost: 1, have: 0 });
  });
  it("이상한 값은 0으로 봐요", () => {
    expect(spendPlan({ freeLeft: Number.NaN, tickets: -1, coins: 2.9 }, 1)).toEqual({ kind: "coin", cost: 1, before: 2, after: 1 });
  });
});

import { describe, expect, it } from "vitest";
import { groupCoinLog } from "../coinHistory";

const t = (s: number) => new Date(Date.UTC(2026, 10, 8, 14, 0, s)).toISOString();

describe("지갑 내역 묶기", () => {
  it("프리미엄 19줄은 한 줄로, 일반 풀이와 구분해요", () => {
    const rows = [
      ...Array.from({ length: 19 }, (_, i) => ({ kind: "spend", delta: -1, created_at: t(30 - i * 0.5) })),
      { kind: "spend", delta: -1, created_at: t(-600) },
    ];
    const g = groupCoinLog(rows);
    expect(g.map((x) => [x.label, x.delta])).toEqual([["프리미엄 종합 사주", -19], ["일반 풀이", -1]]);
  });
  it("체험 구매는 10+10+2 로 나뉘어도 한 줄(22)이에요", () => {
    const g = groupCoinLog([
      { kind: "demo_buy_more", delta: 2, created_at: t(5) },
      { kind: "demo_buy_more", delta: 10, created_at: t(4) },
      { kind: "demo_buy", delta: 10, created_at: t(3) },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ label: "베타 체험 구매", delta: 22 });
  });
  it("delta 0 과 이상한 줄은 건너뛰고, 종류별 이름이 붙어요", () => {
    const g = groupCoinLog([
      { kind: "welcome", delta: 0, created_at: t(1) },
      { kind: "review", delta: 1, created_at: t(-100) },
      { kind: "chat_buy", delta: -1, created_at: t(-300) },
      { kind: "spend", delta: -2, created_at: t(-900) },
      { kind: "x", delta: 3, created_at: "bad" },
    ]);
    expect(g.map((x) => x.label)).toEqual(["정성 후기", "도리 상담실 질문 더하기", "둘의 궁합"]);
  });
  it("최대 20줄까지만 돌려줘요", () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ kind: "review", delta: 1, created_at: t(-i * 100) }));
    expect(groupCoinLog(rows)).toHaveLength(20);
  });
});

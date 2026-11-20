import { describe, expect, it } from "vitest";
import { BOOK_CHAPTERS, currentChapter } from "../PremiumLoadingScene";
import { GENERAL_MIN_MS, PREMIUM_MIN_MS, FINISH_MS, finishPct, premiumProgressAt, progressAt } from "@/components/landing/LoadingBar";

describe("프리미엄 로딩", () => {
  it("진행률에 따라 쓰는 장이 하나씩 올라간다", () => {
    expect(currentChapter(3)).toBe(0);
    expect(currentChapter(50)).toBe(4);
    expect(currentChapter(94)).toBeLessThanOrEqual(BOOK_CHAPTERS.length);
    expect(currentChapter(100)).toBeGreaterThanOrEqual(BOOK_CHAPTERS.length);
  });
  it("프리미엄은 일반보다 천천히 차오르고 94%를 넘지 않는다", () => {
    expect(premiumProgressAt(10)).toBeLessThan(progressAt(10));
    expect(premiumProgressAt(10_000)).toBeLessThanOrEqual(94);
  });
  it("최소 30초 동안은 집필 장면을 보여주고, 그때 막대가 중반 이상까지 와 있다", () => {
    expect(PREMIUM_MIN_MS).toBe(30_000);
    expect(premiumProgressAt(30)).toBeGreaterThan(70);
    expect(premiumProgressAt(5)).toBeLessThan(30);
  });
});

describe("끝날 때 진행률", () => {
  it("지금 값에서 100%로 단조롭게 채운다", () => {
    expect(finishPct(30, 0)).toBe(30);
    expect(finishPct(30, 1)).toBe(100);
    let prev = 30;
    for (let k = 0.1; k <= 1; k += 0.1) {
      const v = finishPct(30, k);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(FINISH_MS).toBeGreaterThan(500);
  });
  it("처음부터 꾸준히 차오르고 92%를 넘지 않는다", () => {
    expect(progressAt(5)).toBeGreaterThan(40);
    expect(progressAt(10)).toBeGreaterThan(60);
    expect(progressAt(1000)).toBeLessThanOrEqual(92);
  });
  it("일반 풀이는 7.1초까지 꾸준히 올라 88%에 닿고, 20%에서 오래 머물지 않는다", () => {
    expect(GENERAL_MIN_MS).toBe(7_100);
    expect(progressAt(7.1)).toBeCloseTo(88, 0);
    // 1초마다 항상 올라가고(멈추지 않고), 20%를 넘기까지 1초를 넘기지 않는다
    for (let s = 1; s <= 7; s++) expect(progressAt(s) - progressAt(s - 1)).toBeGreaterThan(3);
    expect(progressAt(1)).toBeGreaterThan(20);
    expect(progressAt(60)).toBeLessThanOrEqual(92);
  });
});

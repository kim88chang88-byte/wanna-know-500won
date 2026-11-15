import { describe, expect, it } from "vitest";
import { BOOK_CHAPTERS, currentChapter } from "../PremiumLoadingScene";
import { FINISH_MS, finishPct, premiumProgressAt, progressAt } from "@/components/landing/LoadingBar";

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
    expect(progressAt(10)).toBeGreaterThan(70);
    expect(progressAt(1000)).toBeLessThanOrEqual(92);
  });
});

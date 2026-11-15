
import { FINISH_MS, finishPct } from "@/components/landing/LoadingBar";
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
  it("처음부터 꾸준히 차오른다", () => {
    expect(progressAt(5)).toBeGreaterThan(40);
    expect(progressAt(10)).toBeGreaterThan(70);
    expect(progressAt(1000)).toBeLessThanOrEqual(92);
  });
});

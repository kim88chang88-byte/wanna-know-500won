import { describe, expect, it } from "vitest";
import { aiCacheKey, estimateKrw } from "../aiTools";

describe("aiTools", () => {
  it("같은 입력이면 같은 캐시 키, 프롬프트가 바뀌면 다른 키", () => {
    const a = aiCacheKey("m", "sys", "user", { a: 1 }, 100);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(aiCacheKey("m", "sys", "user", { a: 1 }, 100)).toBe(a);
    expect(aiCacheKey("m", "sys2", "user", { a: 1 }, 100)).not.toBe(a);
    expect(aiCacheKey("m2", "sys", "user", { a: 1 }, 100)).not.toBe(a);
  });
  it("모델별 대략 비용(원)", () => {
    expect(estimateKrw("gemini-3.5-flash-lite", 1_000_000, 0)).toBeCloseTo(140, 0);
    expect(estimateKrw("claude-sonnet-5-5", 1_000_000, 1_000_000)).toBeCloseTo(25200, 0);
    expect(estimateKrw("unknown-model", 10, 10)).toBeNull();
  });
});

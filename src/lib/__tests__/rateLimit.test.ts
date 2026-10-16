import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../rateLimit";

describe("createRateLimiter", () => {
  it("한도까지는 허용하고 넘으면 기다릴 시간을 알려준다", () => {
    let t = 1000;
    const rl = createRateLimiter(3, 60_000, () => t);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    const r = rl.check("a");
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.retryAfterSec).toBe(60);
    t += 30_000;
    const r2 = rl.check("a");
    expect(r2.ok === false && r2.retryAfterSec).toBe(30);
  });

  it("창이 지나면 다시 허용, 다른 사용자는 따로 센다", () => {
    let t = 0;
    const rl = createRateLimiter(1, 1000, () => t);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
    expect(rl.check("b").ok).toBe(true);
    t = 1001;
    expect(rl.check("a").ok).toBe(true);
  });
});

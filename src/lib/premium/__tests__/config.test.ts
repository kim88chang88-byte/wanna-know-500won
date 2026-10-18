import { describe, it, expect } from "vitest";
import { isPremiumLocked } from "../config";

describe("프리미엄 잠금 설정", () => {
  it("기본(비어 있음)은 전부 열려 있어요", () => {
    expect(isPremiumLocked({})).toBe(false);
    expect(isPremiumLocked({ PREMIUM_LOCK: "" })).toBe(false);
    expect(isPremiumLocked({ PREMIUM_LOCK: "false" })).toBe(false);
  });
  it("PREMIUM_LOCK=true 일 때만 잠가요", () => {
    expect(isPremiumLocked({ PREMIUM_LOCK: "true" })).toBe(true);
    expect(isPremiumLocked({ PREMIUM_LOCK: " TRUE " })).toBe(true);
  });
});

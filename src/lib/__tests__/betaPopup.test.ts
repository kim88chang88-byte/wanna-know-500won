import { describe, expect, it } from "vitest";
import { kstToday, shouldShowBeta } from "../betaPopup";

describe("오픈베타 팝업 노출", () => {
  const at = Date.UTC(2026, 10, 9, 14, 30); // KST 11-09 23:30
  it("KST 날짜로 센다", () => {
    expect(kstToday(at)).toBe("2026-11-09");
    expect(kstToday(Date.UTC(2026, 10, 9, 15, 1))).toBe("2026-11-10");
  });
  it("저장된 값이 없으면 보여준다", () => {
    expect(shouldShowBeta(null, at)).toBe(true);
  });
  it("오늘 숨김이면 안 보이고 다음 날엔 다시 보인다", () => {
    expect(shouldShowBeta("2026-11-09", at)).toBe(false);
    expect(shouldShowBeta("2026-11-09", Date.UTC(2026, 10, 9, 15, 1))).toBe(true);
  });
});

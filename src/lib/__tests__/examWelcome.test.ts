import { describe, expect, it } from "vitest";
import { shouldShowExamWelcome } from "../examWelcome";

describe("수험생 환영 팝업", () => {
  it("기간 안에서는 보여 주고, 오늘 숨김이면 감춰요", () => {
    expect(shouldShowExamWelcome(null, "2026-11-28")).toBe(true);
    expect(shouldShowExamWelcome("2026-11-27", "2026-11-28")).toBe(true);
    expect(shouldShowExamWelcome("2026-11-28", "2026-11-28")).toBe(false);
  });
  it("마지막 날 다음 날부터는 뜨지 않아요", () => {
    expect(shouldShowExamWelcome(null, "2026-12-31")).toBe(true);
    expect(shouldShowExamWelcome(null, "2027-01-01")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { applyLocks } from "../book/lock";

const NOW = new Date("2026-11-14T11:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const FORBIDDEN = ["횡재", "파산", "손해 본다", "망한", "반드시 돈", "투자하세요", "사세요"];

describe("재물 달력(앞으로 12달)", () => {
  for (const gender of ["female", "male"] as const) {
    it(`${gender}: 재물 장에 12칸이 있고 값이 정상이다`, () => {
      const r = buildPremiumReport({ ...base, gender }, NOW, "full", "재물운", false);
      const cal = r.book.find((p) => p.key === "topic:money")!.tables.find((t) => t.title === "재물 달력");
      expect(cal).toBeDefined();
      expect(cal!.rows.length).toBe(12);
      expect(cal!.rows.filter((x) => x.current).length).toBe(1);
      expect(cal!.rows[0].label).toMatch(/^'26 11월$/);
      expect(cal!.rows[1].label).toMatch(/^'26 12월$/);
      expect(cal!.rows[2].label).toMatch(/^'27 1월$/);
      for (const x of cal!.rows) {
        expect(x.bar).toBeGreaterThanOrEqual(20);
        expect(x.bar).toBeLessThanOrEqual(95);
        expect(x.value.length).toBeGreaterThan(3);
        for (const w of FORBIDDEN) expect(x.value.includes(w)).toBe(false);
      }
    });
  }

  it("잠금 미리보기는 앞 석 달만 열린다", () => {
    const r = buildPremiumReport(base, NOW, "full", "재물운", false);
    const cal = applyLocks(r.book, 2026).find((p) => p.key === "topic:money")!.tables.find((t) => t.title === "재물 달력")!;
    expect(cal.rows.map((x) => !!x.locked)).toEqual([false, false, false, true, true, true, true, true, true, true, true, true]);
    expect(cal.rows[5].bar).toBeUndefined();
  });

  it("20쪽을 그대로 지킨다", () => {
    expect(buildPremiumReport(base, NOW, "full", "재물운", false).book.length).toBe(20);
  });
});

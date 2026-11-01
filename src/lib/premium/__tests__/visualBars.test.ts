import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };

describe("프리미엄 책 그림용 값(달별·연도별 막대)", () => {
  const book = buildPremiumReport(base, NOW, "full", "재물운").book;
  const months = book.find((p) => p.key === "years:2")?.tables[0];
  const years = book.find((p) => p.key === "years")?.tables[0];

  it("달별 12칸에 0~100 지수가 있고 '지금' 달이 한 칸이다", () => {
    expect(months?.rows).toHaveLength(12);
    for (const r of months!.rows) expect(r.bar).toBeGreaterThanOrEqual(20);
    for (const r of months!.rows) expect(r.bar).toBeLessThanOrEqual(95);
    expect(months!.rows.filter((r) => r.current)).toHaveLength(1);
  });

  it("연도별 5칸에 지수가 있고 올해가 '지금'이다", () => {
    expect(years?.rows.length).toBeGreaterThanOrEqual(4);
    expect(years!.rows.every((r) => typeof r.bar === "number")).toBe(true);
    expect(years!.rows.filter((r) => r.current)).toHaveLength(1);
  });

  it("십성 표에는 기운 5개가 모두 있다", () => {
    const t = book.find((p) => p.key === "tengods")?.tables[0];
    expect(t?.rows.map((r) => r.label).sort()).toEqual(["관성", "비겁", "식상", "인성", "재성"]);
  });

  it("미리 보기로 가려진 쪽에는 지수가 내려가지 않는다", () => {
    const blank = buildPremiumReport(base, NOW, "full", "재물운", true).book;
    const rows = blank.flatMap((p) => p.tables.flatMap((t) => t.rows)).filter((r) => r.locked);
    expect(rows.every((r) => r.bar === undefined && r.current === undefined)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { previewBlank } from "../book/lock";
import { formatWon } from "../book/charts";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const KEYS = ["topic:money", "topic:love", "topic:career"];

describe("나이별 기운 흐름 그래프", () => {
  for (const gender of ["female", "male"] as const) {
    it(`${gender}: 재물·연애·직업 장에 그래프가 있고 값이 정상이다`, () => {
      const r = buildPremiumReport({ ...base, gender }, NOW, "full", "연애운", false);
      for (const k of KEYS) {
        const chart = r.book.find((p) => p.key === k)?.chart;
        expect(chart, k).toBeDefined();
        const pts = chart!.points;
        expect(pts.length).toBeGreaterThanOrEqual(8);
        for (const p of pts) {
          expect(p.value).toBeGreaterThanOrEqual(8);
          expect(p.value).toBeLessThanOrEqual(95);
          expect(p.endAge).toBeGreaterThan(p.age);
        }
        expect(pts.filter((p) => p.current).length).toBeLessThanOrEqual(1);
        expect(pts.filter((p) => p.peak === 1).length).toBe(1);
        expect(pts.find((p) => p.peak === 1)!.value).toBe(Math.max(...pts.map((p) => p.value)));
        expect(chart!.callouts[0].text).toMatch(/세/);
      }
    });
  }

  it("재물 그래프는 가상 누적 자산(만원)으로 그려지고 20세 이후 줄지 않는다", () => {
    const r = buildPremiumReport(base, NOW, "full", "재물운", false);
    const chart = r.book.find((p) => p.key === "topic:money")!.chart!;
    expect(chart.mode).toBe("asset");
    const amts = chart.points.map((p) => p.amount ?? 0);
    for (let i = 1; i < amts.length; i++) expect(amts[i]).toBeGreaterThanOrEqual(amts[i - 1]);
    expect(Math.max(...amts)).toBeGreaterThanOrEqual(30_000);
    expect(Math.max(...amts)).toBeLessThanOrEqual(250_000);
    expect(chart.caption).toMatch(/실제 수입·재산/);
    expect(chart.callouts.some((c) => /억|만원/.test(c.text))).toBe(true);
  });

  it("연애·직업 그래프는 금액이 아니라 지수다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    expect(r.book.find((p) => p.key === "topic:love")!.chart!.mode).toBe("index");
    expect(r.book.find((p) => p.key === "topic:career")!.chart!.points.every((p) => p.amount === undefined)).toBe(true);
  });

  it("그래프가 없는 장도 있다(서문 등)", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    expect(r.book.find((p) => p.key === "preface")?.chart).toBeUndefined();
  });

  it("같은 입력이면 같은 그래프이고, 남녀에 따라 연애 그래프가 다를 수 있다", () => {
    const a = buildPremiumReport(base, NOW, "full", "연애운", false);
    const b = buildPremiumReport(base, NOW, "full", "연애운", false);
    expect(JSON.stringify(a.book.find((p) => p.key === "topic:love")?.chart)).toBe(JSON.stringify(b.book.find((p) => p.key === "topic:love")?.chart));
  });

  it("잠그면 현재 대운 이후 칸이 가려지고 풀이 문구가 빠진다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", true);
    const chart = r.book.find((p) => p.key === "topic:money")!.chart!;
    const ci = chart.points.findIndex((p) => p.current);
    expect(ci).toBeGreaterThanOrEqual(0);
    chart.points.forEach((p, i) => expect(Boolean(p.locked)).toBe(i > ci));
    expect(chart.callouts.every((c) => c.label === "지금 시기")).toBe(true);
    expect(JSON.stringify(chart.points.filter((p) => p.locked).map((p) => p.value))).toBe(JSON.stringify(chart.points.filter((p) => p.locked).map(() => 0)));
  });

  it("미리 보기에서 가려진 쪽은 그래프도 내려가지 않는다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const blank = previewBlank(r.book, 5);
    for (const p of blank.filter((x) => x.no >= 5)) expect(p.chart).toBeUndefined();
  });
});

describe("formatWon", () => {
  it("만원·억 단위를 읽기 쉽게 바꾼다", () => {
    expect(formatWon(5000)).toBe("5,000만원");
    expect(formatWon(32000)).toBe("3.2억");
    expect(formatWon(120000)).toBe("12억");
    expect(formatWon(30000)).toBe("3억");
  });
});

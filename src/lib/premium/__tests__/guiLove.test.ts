import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport } from "../report";
import { partnerCard } from "../loveCard";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };

describe("제6장 귀인 확장", () => {
  it("천을귀인·귀인이 되어 주는 사람·도움 청하기 좋은 시기가 있고 단정하지 않는다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const gui = r.book.find((x) => x.key === "gui")!;
    expect(gui.title).toContain("[귀인운]");
    const heads = gui.sections.map((s) => s.heading).join("|");
    for (const w of ["내 천을귀인", "내게 귀인이 되어 주기 쉬운 사람", "도움을 청하기 좋은 시기", "귀인이 곁에 오면"]) expect(heads).toContain(w);
    const all = JSON.stringify(gui);
    expect(all).toMatch(/띠/);
    for (const w of ["곰탱이", "나타난다", "반드시", "undefined", "NaN"]) expect(all.includes(w === "나타난다" ? "귀인이 나타난다고 " : w)).toBe(false);
    expect(r.book.length).toBe(20);
  });
});

describe("연애운 짝 카드", () => {
  it("유형명·연결 근거·시기·장소가 만들어진다", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const c = partnerCard({ element: "water", seed: 4, dayStem: r.pillars.find((p) => p.key === "day")!.full![0], pillars: r.pillars.map((p) => ({ key: p.key, full: p.full })), profile: [{ label: "처음 만나는 곳", tags: ["북카페", "전시회"] }], now: NOW });
    expect(c.typeName).toMatch(/상$/);
    expect(c.link).toContain("수 기운");
    expect(c.when).toMatch(/\d{4}년 \d+월경|사이/);
    expect(c.where).toBe("북카페 · 전시회");
    expect(JSON.stringify(c)).not.toMatch(/undefined|NaN|MATCH|%/);
  });
  it("같은 입력이면 같은 결과", () => {
    const r = buildPremiumReport(base, NOW, "full", "연애운", false);
    const mk = () => partnerCard({ element: "fire", seed: 7, dayStem: "甲", pillars: r.pillars.map((p) => ({ key: p.key, full: p.full })), profile: [], now: NOW });
    expect(mk()).toEqual(mk());
  });
});

import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import type { Concern } from "@/lib/concerns";
import { buildPremiumReport } from "../report";
import { applyLocks } from "../book/lock";

const NOW = new Date("2026-11-14T11:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };
const HEAD = "네 고민과 이어 보면";
const SKIP = ["preface", "overview", "concernTop", "concern"];
const FORBIDDEN = ["undefined", "NaN", "null", "망한", "파산", "반드시", "큰일"];
const concern: Concern = { tags: ["money", "love"] as Concern["tags"], text: "이직을 해야 할지 계속 고민돼요" };

describe("요즘 고민을 모든 장에 이어 붙이기", () => {
  it("고민이 있으면 16개 장의 둘째 자리에 이어진다", () => {
    const r = buildPremiumReport(base, NOW, "full", "", false, concern);
    expect(r.book.length).toBe(20);
    let n = 0;
    for (const p of r.book) {
      const woven = p.sections.filter((s) => s.heading === HEAD);
      if (SKIP.includes(p.key)) {
        expect(woven.length).toBe(0);
        continue;
      }
      expect(woven.length).toBe(1);
      expect(p.sections[1].heading).toBe(HEAD);
      const b = woven[0].body;
      expect(b).toContain("이직을 해야 할지");
      for (const w of FORBIDDEN) expect(b.includes(w)).toBe(false);
      expect(b.length).toBeGreaterThan(80);
      n++;
    }
    expect(n).toBe(16);
  });

  it("고민이 없으면 아무것도 끼우지 않는다", () => {
    const r = buildPremiumReport(base, NOW, "full", "", false, null);
    for (const p of r.book) expect(p.sections.some((s) => s.heading === HEAD)).toBe(false);
  });

  it("잠금을 걸어도 이어 붙인 토막은 열려 있다", () => {
    const r = buildPremiumReport(base, NOW, "full", "", false, concern);
    for (const p of applyLocks(r.book, 2026)) {
      const s = p.sections.find((x) => x.heading === HEAD);
      if (s) expect(s.locked).toBeFalsy();
    }
  });
});

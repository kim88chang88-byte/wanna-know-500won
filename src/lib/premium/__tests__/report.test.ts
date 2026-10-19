import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { buildPremiumReport, validatePremiumInput } from "../report";

const NOW = new Date("2026-10-18T00:00:00+09:00");
const base: BirthInput = { year: 1990, month: 7, day: 13, hour: 8, minute: 30, calendar: "solar", isLeapMonth: false, gender: "female" };

describe("buildPremiumReport", () => {
  it("원국 4기둥, 오행 5줄(목화토금수), 신강·신약·격국·용신을 만든다", () => {
    const r = buildPremiumReport(base, NOW);
    expect(r.pillars.map((p) => p.full)).toEqual(["庚午", "癸未", "己卯", "戊辰"]);
    expect(r.pillars[2].tenGodStem).toBe("일간");
    expect(r.elements.map((e) => e.name)).toEqual(["목", "화", "토", "금", "수"]);
    expect(r.elements.reduce((a, e) => a + e.count, 0)).toBe(8);
    expect(["신강", "신약", "중화"]).toContain(r.strength.grade);
    expect(r.geukguk.length).toBeGreaterThan(0);
    expect(r.yongsin.length).toBeGreaterThan(0);
    expect(r.yongsin[0]).toMatch(/^.\(.\)$/); // 丙(병)
    expect(r.hourUnknown).toBe(false);
  });
  it("대운 10칸 중 현재 대운이 하나 표시되고, 올해 세운이 나온다", () => {
    const r = buildPremiumReport(base, NOW);
    expect(r.daeun?.list).toHaveLength(10);
    expect(r.daeun?.list.filter((d) => d.current)).toHaveLength(1);
    expect(r.seyun?.year).toBe(2026);
    expect(r.seyun?.ganzhi).toBe("丙午");
  });
  it("basic 이면 원국·오행·신강신약만 주고, 격국·용신·대운·세운·설명은 비운다", () => {
    const r = buildPremiumReport(base, NOW, "basic");
    expect(r.level).toBe("basic");
    expect(r.pillars.map((p) => p.full)).toEqual(["庚午", "癸未", "己卯", "戊辰"]);
    expect(r.strength.grade.length).toBeGreaterThan(0);
    expect(r.geukguk).toBe("");
    expect(r.yongsin).toEqual([]);
    expect(r.gilsin).toEqual([]);
    expect(r.daeun).toBeNull();
    expect(r.seyun).toBeNull();
    expect(r.summary).toBe("");
    expect(buildPremiumReport(base, NOW).level).toBe("full");
  });
  it("시간을 모르면 시주를 비우고, 오행은 보이는 세 기둥(6글자)만 센다", () => {
    const r = buildPremiumReport({ ...base, hour: null, minute: null }, NOW);
    expect(r.hourUnknown).toBe(true);
    expect(r.pillars[3].full).toBeNull();
    expect(r.elements.reduce((a, e) => a + e.count, 0)).toBe(6);
  });
  it("음력 입력도 계산하고, 남/녀 모두 동작한다", () => {
    const lunar = buildPremiumReport({ ...base, year: 1990, month: 5, day: 21, calendar: "lunar", gender: "male" }, NOW);
    expect(lunar.pillars[0].full).toBe("庚午");
    expect(lunar.daeun).not.toBeNull();
  });
  it("없는 날짜는 오류를 던진다", () => {
    expect(() => buildPremiumReport({ ...base, month: 2, day: 31 }, NOW)).toThrow();
  });
});

describe("validatePremiumInput", () => {
  it("정상 입력", () => {
    expect(validatePremiumInput(base).ok).toBe(true);
  });
  it("level 은 full 일 때만 full, 나머지는 basic", () => {
    const lv = (v: unknown) => { const r = validatePremiumInput({ ...base, level: v }); return r.ok ? r.level : null; };
    expect(lv("full")).toBe("full");
    expect(lv("basic")).toBe("basic");
    expect(lv(undefined)).toBe("basic");
    expect(lv("admin")).toBe("basic");
  });
  it("시간 미상(null)도 허용", () => {
    const r = validatePremiumInput({ ...base, hour: null, minute: null });
    expect(r.ok && r.value.hour).toBeNull();
  });
  it.each([
    [{ ...base, month: 13 }],
    [{ ...base, year: 1800 }],
    [{ ...base, hour: 24 }],
    [{ ...base, gender: "x" }],
    [{ ...base, calendar: "moon" }],
    [null],
  ])("잘못된 입력은 거절 %#", (input) => {
    expect(validatePremiumInput(input).ok).toBe(false);
  });
});

describe("validatePremiumInput · 상대방(궁합)", () => {
  const me = { year: 1990, month: 5, day: 17, hour: 9, minute: 30, calendar: "solar", gender: "female" };
  it("partner 가 없으면 null", () => {
    const r = validatePremiumInput(me);
    expect(r.ok && r.partner).toBe(null);
  });
  it("올바른 partner 를 받는다 (시간 모름 포함)", () => {
    const r = validatePremiumInput({ ...me, partner: { year: 1992, month: 3, day: 4, hour: null, minute: null, calendar: "solar", gender: "male" } });
    expect(r.ok && r.partner).toMatchObject({ year: 1992, month: 3, day: 4, hour: null, gender: "male" });
  });
  it("잘못된 partner 는 상대방 안내 문구로 거절한다", () => {
    const r = validatePremiumInput({ ...me, partner: { year: 1992, month: 13, day: 4, calendar: "solar", gender: "male" } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("상대방");
  });
});

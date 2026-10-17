import { describe, expect, it } from "vitest";
import { parseManseResult, validateSazuInput } from "../report";

const sample = {
  modules: {
    fourPillars: { year: { full: "庚午" }, month: { full: "辛巳" }, day: { full: "甲子" }, hour: { full: "戊辰" } },
    elements: {
      water: { name: "수", total: { count: 1 } },
      wood: { name: "목", total: { count: 3 } },
      fire: { name: "화", total: { count: 2 } },
      earth: { name: "토", total: { count: 0 } },
      metal: { name: "금", total: { count: 2 } },
    },
    sinStrength: { strength: "신강", analysis: "자기 기운이 강한 편이에요." },
  },
};

describe("parseManseResult", () => {
  it("원국 4기둥, 오행(목화토금수 순), 신강약을 꺼낸다", () => {
    const r = parseManseResult(sample);
    expect(r.pillars.map((p) => p.full)).toEqual(["庚午", "辛巳", "甲子", "戊辰"]);
    expect(r.elements.map((e) => e.name)).toEqual(["목", "화", "토", "금", "수"]);
    expect(r.elements.map((e) => e.count)).toEqual([3, 2, 0, 2, 1]);
    expect(r.strength).toEqual({ grade: "신강", analysis: "자기 기운이 강한 편이에요." });
  });
  it("data.modules 로 감싸져 와도 읽는다", () => {
    expect(parseManseResult({ data: sample }).pillars[2].full).toBe("甲子");
  });
  it("시간 미상이면 시주는 null, 이상한 응답에도 깨지지 않는다", () => {
    const r = parseManseResult({ modules: { fourPillars: { hour: null } } });
    expect(r.pillars[3].full).toBeNull();
    expect(r.elements).toEqual([]);
    expect(r.strength).toBeNull();
    expect(parseManseResult(null).pillars).toHaveLength(4);
  });
});

describe("validateSazuInput", () => {
  const ok = { year: 1990, month: 5, day: 17, hour: 8, minute: 30, isFemale: true, isLunar: false, city: "서울" };
  it("정상 입력", () => {
    expect(validateSazuInput(ok).ok).toBe(true);
  });
  it("시간 미상(null)도 허용", () => {
    const r = validateSazuInput({ ...ok, hour: null, minute: null });
    expect(r.ok && r.value.hour).toBeNull();
  });
  it.each([
    [{ ...ok, month: 0 }],
    [{ ...ok, month: 13 }],
    [{ ...ok, year: 1800 }],
    [{ ...ok, hour: 24 }],
    [{ ...ok, isFemale: "x" }],
    [{ ...ok, city: "" }],
    [null],
  ])("잘못된 입력은 거절 %#", (input) => {
    expect(validateSazuInput(input).ok).toBe(false);
  });
});

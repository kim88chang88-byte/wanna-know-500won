import { describe, expect, it } from "vitest";
import { EMPTY_FORM, buildBirthInput, validateStep } from "../intake";
import { ageBand, parseProfileRow, profileSummary, profileToForm, sameBirth } from "../profile";
import type { BirthInput } from "../saju/types";

const solar: BirthInput = { year: 1995, month: 3, day: 4, hour: 9, minute: 5, calendar: "solar", isLeapMonth: false, gender: "female" };
const lunar: BirthInput = { year: 2020, month: 4, day: 8, hour: null, minute: null, calendar: "lunar", isLeapMonth: true, gender: "male" };

describe("저장된 생년월일시", () => {
  it("질문지로 되돌리면 같은 입력이 다시 만들어져요 (양력·음력·시간 모름)", () => {
    for (const p of [solar, lunar]) {
      const form = { ...EMPTY_FORM, ...profileToForm(p), consent: true };
      expect(validateStep("date", form)).toBeNull();
      expect(validateStep("time", form)).toBeNull();
      expect(buildBirthInput(form)).toEqual(p);
    }
  });
  it("요약 문구", () => {
    expect(profileSummary(solar)).toBe("1995.03.04 (양력) 09:05 · 여성");
    expect(profileSummary(lunar)).toBe("2020.04.08 (음력 윤달) 시간 모름 · 남성");
  });
  it("같은지 비교: 시간·성별·윤달이 다르면 다른 값", () => {
    expect(sameBirth(solar, { ...solar })).toBe(true);
    expect(sameBirth(solar, { ...solar, minute: 6 })).toBe(false);
    expect(sameBirth(solar, { ...solar, gender: "male" })).toBe(false);
    expect(sameBirth(lunar, { ...lunar, isLeapMonth: false })).toBe(false);
    expect(sameBirth(null, solar)).toBe(false);
  });
  it("나이대는 10살 단위로만 (생년월일은 남기지 않아요)", () => {
    const now = new Date("2026-10-18T00:00:00Z");
    expect(ageBand(1995, now)).toBe("30s");
    expect(ageBand(2003, now)).toBe("20s");
    expect(ageBand(2020, now)).toBe("0s");
    expect(ageBand(1950, now)).toBe("60s+");
  });
  it("DB 행 검사: 이상한 값은 버려요", () => {
    expect(parseProfileRow({ calendar: "solar", year: 1995, month: 3, day: 4, is_leap: false, hour: 9, minute: 5, gender: "female" })).toEqual(solar);
    expect(parseProfileRow({ calendar: "lunar", year: 2020, month: 4, day: 8, is_leap: true, hour: null, minute: null, gender: "male" })).toEqual(lunar);
    expect(parseProfileRow({ calendar: "x", year: 1995, month: 3, day: 4, gender: "female" })).toBeNull();
    expect(parseProfileRow({ calendar: "solar", year: 1995, month: 3, day: 4, hour: 25, gender: "female" })).toBeNull();
    expect(parseProfileRow(null)).toBeNull();
  });
});

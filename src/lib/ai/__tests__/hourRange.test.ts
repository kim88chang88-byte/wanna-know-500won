import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/lib/saju/types";
import { findCandidates, parseHours, parseRange } from "../hourRange";

const base: BirthInput = { year: 1988, month: 11, day: 4, hour: null, minute: null, calendar: "solar", gender: "male" };

describe("시간 범위", () => {
  it("범위를 검사한다", () => {
    expect(parseRange(7, 9)).toEqual({ ok: true, start: 7, end: 9 });
    expect(parseRange(9, 7).ok).toBe(false);
    expect(parseRange(0, 6).ok).toBe(false);
    expect(parseRange("7", 9).ok).toBe(false);
    expect(parseRange(23, 24).ok).toBe(true);
  });
  it("두 시간 단위(시진) 안에서는 후보가 하나다", () => {
    // 07:30~09:29 은 辰시(07:30~09:29) 한 칸이라 시주가 같아요
    expect(findCandidates(base, 8, 9, () => null).length).toBe(1);
  });
  it("시진 경계를 걸치면 후보가 둘 이상이고 시주가 서로 다르다", () => {
    const c = findCandidates(base, 6, 10, () => null);
    expect(c.length).toBeGreaterThan(1);
    expect(new Set(c.map((x) => x.hourPillar)).size).toBe(c.length);
  });
  it("후보는 3개까지만", () => {
    expect(findCandidates(base, 0, 4, () => null).length <= 3).toBe(true);
  });
  it("AI 응답 검사: 후보 수가 다르면 거른다", () => {
    const ok = { candidates: [{ feel: "차분하고 안정감이 큰 결이에요." }, { feel: "표현이 많고 활동적인 결이에요." }], common: "일주는 어느 쪽이든 그대로예요.", differ: "시주 자리가 달라져서 말년 흐름이 달라져요.", howToCheck: "부모님께 여쭤보거나 산모수첩을 확인해 보세요." };
    expect(parseHours(ok, 2)?.feels.length).toBe(2);
    expect(parseHours(ok, 3)).toBeNull();
  });
});

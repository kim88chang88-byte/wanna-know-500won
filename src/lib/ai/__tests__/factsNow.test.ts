import { describe, expect, it } from "vitest";
import { buildCoreFacts, factsNowFor } from "../coreFacts";
import { elEasyName } from "@/lib/elementColor";

describe("신년운 사주 계산 기준", () => {
  const birth = { year: 1988, month: 12, day: 29, hour: 10, minute: 0, gender: "male" as const, calendar: "solar" as const };
  it("신년운(study)만 2027년 기준으로 계산한다", () => {
    const now = new Date("2026-11-03T12:00:00+09:00");
    expect(factsNowFor("study", now).getFullYear()).toBe(2027);
    expect(factsNowFor("success", now)).toBe(now);
  });
  it("2027년 기준이면 올해 세운이 정미(丁未)다", () => {
    const core = buildCoreFacts(birth, factsNowFor("study", new Date("2026-11-03T12:00:00+09:00")));
    expect(core?.올해세운?.간지).toBe("丁未");
  });
  it("오행 이름은 쉬운 말로 바꾼다", () => {
    expect(["목", "화", "토", "금", "수"].map(elEasyName)).toEqual(["나무", "불", "땅", "쇠", "물"]);
  });
});

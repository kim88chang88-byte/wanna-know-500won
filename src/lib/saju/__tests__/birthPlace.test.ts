import { describe, expect, it } from "vitest";
import { buildBirthFields, EMPTY_BIRTH } from "@/lib/intake";
import { adjustNote, BIRTH_PLACES, isBirthPlace, placeOffsetMinutes, resolveBirth } from "../birthPlace";

describe("출생지 경도 보정", () => {
  it("서울은 약 -32분, 부산은 약 -24분", () => {
    expect(placeOffsetMinutes("서울", 1988, 11, 4)).toBe(-32);
    expect(placeOffsetMinutes("부산", 1988, 11, 4)).toBe(-24);
  });
  it("1954~1961 표준시 기준(127.5도)에서는 서울이 -2분", () => {
    expect(placeOffsetMinutes("서울", 1958, 5, 5)).toBe(-2);
  });
  it("모르는 곳이면 null", () => {
    expect(placeOffsetMinutes("화성", 1988, 11, 4)).toBeNull();
    expect(isBirthPlace("화성")).toBe(false);
    expect(BIRTH_PLACES.every((p) => isBirthPlace(p.name))).toBe(true);
  });
  it("시간을 모르거나 출생지가 없으면 보정하지 않고 birthPlace 는 떼어내요", () => {
    const a = resolveBirth({ year: 1988, month: 11, day: 4, hour: null, calendar: "solar", gender: "male", birthPlace: "서울" });
    expect(a.adjust).toBeNull();
    expect("birthPlace" in a.input).toBe(false);
    const b = resolveBirth({ year: 1988, month: 11, day: 4, hour: 16, minute: 55, calendar: "solar", gender: "male" });
    expect(b.adjust).toBeNull();
    expect(b.input.hour).toBe(16);
  });
  it("안내 문구", () => {
    expect(adjustNote({ label: "서울 −32분", minutes: -32, applied: true, hourChanged: true, dayChanged: false })).toContain("시주가 달라졌어요");
    expect(adjustNote({ label: "서울 −32분", minutes: -32, applied: false, hourChanged: false, dayChanged: false, reason: "x" })).toContain("x");
  });
  it("입력 화면: 시간을 알 때만 birthPlace 를 담아요", () => {
    const f = { ...EMPTY_BIRTH, solarDate: "1988-11-04", time: "16:55", gender: "male" as const, birthPlace: "서울" };
    expect(buildBirthFields(f)?.birthPlace).toBe("서울");
    expect(buildBirthFields({ ...f, timeKnown: false })?.birthPlace).toBeUndefined();
    expect(buildBirthFields({ ...f, birthPlace: "화성" })?.birthPlace).toBeUndefined();
  });
  it("조자시 선택은 23시대·시간을 알 때만 담아요", () => {
    const f = { ...EMPTY_BIRTH, solarDate: "1988-11-04", time: "23:30", gender: "male" as const, lateZi: "nextDay" as const };
    expect(buildBirthFields(f)?.lateZi).toBe("nextDay");
    expect(buildBirthFields({ ...f, lateZi: "sameDay" })?.lateZi).toBeUndefined();
    expect(buildBirthFields({ ...f, timeKnown: false })?.lateZi).toBeUndefined();
  });
  it("시간을 모르면 조자시도 무시하고 lateZi 를 떼어내요", () => {
    const a = resolveBirth({ year: 1988, month: 11, day: 4, hour: null, calendar: "solar", gender: "male", lateZi: "nextDay" });
    expect(a.adjust).toBeNull();
    expect("lateZi" in a.input).toBe(false);
  });
});

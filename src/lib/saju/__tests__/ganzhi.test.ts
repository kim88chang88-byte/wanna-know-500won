import { describe, expect, it } from "vitest";
import {
  addDays,
  dayIndex,
  dayPillar,
  hourBranchIndex,
  hourPillar,
  isValidDate,
  julianDayNumber,
  parsePillar,
  pillarFromIndex,
  resolveDayAndHour,
  shiftWallTime,
} from "../ganzhi";

const p = (text: string) => parsePillar(text);

describe("julianDayNumber / dayPillar", () => {
  it("2000-01-01 의 JDN 은 2451545", () => {
    expect(julianDayNumber(2000, 1, 1)).toBe(2451545);
  });

  it("알려진 일주와 일치한다", () => {
    expect(dayPillar({ year: 2000, month: 1, day: 1 })).toEqual(p("戊午"));
    expect(dayPillar({ year: 1900, month: 1, day: 1 })).toEqual(p("甲戌"));
    expect(dayPillar({ year: 1949, month: 10, day: 1 })).toEqual(p("甲子"));
  });

  it("하루에 한 칸씩 넘어가고 60일마다 반복된다", () => {
    const start = { year: 2024, month: 3, day: 1 };
    const base = dayIndex(start);
    expect(dayIndex(addDays(start, 1))).toBe((base + 1) % 60);
    expect(dayIndex(addDays(start, 60))).toBe(base);
    expect(dayIndex(addDays(start, -60))).toBe(base);
  });

  it("윤년 2월 29일을 지나도 연속된다", () => {
    const a = dayIndex({ year: 2024, month: 2, day: 28 });
    const b = dayIndex({ year: 2024, month: 2, day: 29 });
    const c = dayIndex({ year: 2024, month: 3, day: 1 });
    expect(b).toBe((a + 1) % 60);
    expect(c).toBe((b + 1) % 60);
  });

  it("pillarFromIndex 는 0=甲子, 59=癸亥", () => {
    expect(pillarFromIndex(0)).toEqual(p("甲子"));
    expect(pillarFromIndex(59)).toEqual(p("癸亥"));
    expect(pillarFromIndex(60)).toEqual(p("甲子"));
    expect(pillarFromIndex(-1)).toEqual(p("癸亥"));
  });
});

describe("시주", () => {
  it("시지 경계", () => {
    expect(hourBranchIndex(23)).toBe(0);
    expect(hourBranchIndex(0)).toBe(0);
    expect(hourBranchIndex(1)).toBe(1);
    expect(hourBranchIndex(2)).toBe(1);
    expect(hourBranchIndex(3)).toBe(2);
    expect(hourBranchIndex(12)).toBe(6);
    expect(hourBranchIndex(22)).toBe(11);
  });

  it("오서둔: 일간별 子시의 천간", () => {
    // 갑·기 → 甲子, 을·경 → 丙子, 병·신 → 戊子, 정·임 → 庚子, 무·계 → 壬子
    const zi = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((stem) => hourPillar(stem, 0).stem);
    expect(zi).toEqual(["甲", "丙", "戊", "庚", "壬", "甲", "丙", "戊", "庚", "壬"]);
  });

  it("알려진 시주", () => {
    expect(hourPillar(4, 12)).toEqual(p("戊午")); // 戊日 午時
    expect(hourPillar(2, 5)).toEqual(p("辛卯")); // 丙日 卯時
  });
});

describe("야자시 / 조자시", () => {
  // 2000-01-01 = 戊午일, 2000-01-02 = 己未일
  const jan1 = { year: 2000, month: 1, day: 1 };

  it("23시 이전은 두 방식 모두 같다", () => {
    const a = resolveDayAndHour(jan1, 22, "sameDay");
    const b = resolveDayAndHour(jan1, 22, "nextDay");
    expect(a).toEqual(b);
    expect(a.day).toEqual(p("戊午"));
    expect(a.hour).toEqual(p("癸亥")); // 戊日 亥時
  });

  it("sameDay: 일주는 당일, 시주 천간은 다음 날 일간 기준", () => {
    const r = resolveDayAndHour(jan1, 23, "sameDay");
    expect(r.day).toEqual(p("戊午"));
    expect(r.hour).toEqual(p("甲子")); // 己日 子時
  });

  it("nextDay: 일주도 다음 날, 시주는 sameDay 와 동일", () => {
    const r = resolveDayAndHour(jan1, 23, "nextDay");
    expect(r.day).toEqual(p("己未"));
    expect(r.hour).toEqual(p("甲子"));
  });

  it("자정 이후(00시)는 새 날의 子시", () => {
    const r = resolveDayAndHour({ year: 2000, month: 1, day: 2 }, 0, "sameDay");
    expect(r.day).toEqual(p("己未"));
    expect(r.hour).toEqual(p("甲子"));
  });

  it("시각을 모르면 시주는 null", () => {
    expect(resolveDayAndHour(jan1, undefined, "sameDay")).toEqual({ day: p("戊午"), hour: null });
  });
});

describe("날짜/시간 유틸", () => {
  it("isValidDate", () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
    expect(isValidDate(2023, 4, 31)).toBe(false);
    expect(isValidDate(2023, 13, 1)).toBe(false);
    expect(isValidDate(2023, 1.5, 1)).toBe(false);
  });

  it("shiftWallTime 은 자정을 넘어 날짜를 바꾼다", () => {
    expect(shiftWallTime({ year: 2024, month: 3, day: 1, hour: 0, minute: 10 }, -60)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
      hour: 23,
      minute: 10,
    });
    expect(shiftWallTime({ year: 2023, month: 12, day: 31, hour: 23, minute: 30 }, 60)).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      hour: 0,
      minute: 30,
    });
  });

  it("parsePillar 는 간지가 아닌 값을 거부한다", () => {
    expect(() => parsePillar("AB")).toThrow();
    expect(() => parsePillar("甲")).toThrow();
    expect(() => parsePillar("甲子丑")).toThrow();
  });
});

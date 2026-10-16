import { describe, expect, it } from "vitest";
import { calculateSaju } from "../calculate";
import { STEMS, BRANCHES } from "../constants";
import { SajuInputError } from "../errors";
import { addDays, dayPillar, parsePillar } from "../ganzhi";
import type { BirthInput, Pillar } from "../types";

const p = (text: string) => parsePillar(text);
const solar = (year: number, month: number, day: number, hour?: number, minute = 0): BirthInput => ({
  year,
  month,
  day,
  hour,
  minute,
  calendar: "solar",
  gender: "male",
});

describe("연주·월주: 절기는 한국 표준시(KST) 기준으로 판정한다", () => {
  // 2024 입춘: 2024-02-04 17:27 KST (중국 시계로는 16:27)
  it("입춘 직전 17:00 KST 는 아직 전년도(癸卯년 乙丑월)", () => {
    const c = calculateSaju(solar(2024, 2, 4, 17, 0));
    expect(c.year).toEqual(p("癸卯"));
    expect(c.month).toEqual(p("乙丑"));
  });

  it("입춘 직후 18:00 KST 는 甲辰년 丙寅월", () => {
    const c = calculateSaju(solar(2024, 2, 4, 18, 0));
    expect(c.year).toEqual(p("甲辰"));
    expect(c.month).toEqual(p("丙寅"));
  });

  // 2021 입춘: 2021-02-03 23:59 KST
  it("2021 입춘(2/3 23:59) 전후", () => {
    expect(calculateSaju(solar(2021, 2, 3, 23, 30)).year).toEqual(p("庚子"));
    expect(calculateSaju(solar(2021, 2, 4, 0, 30)).year).toEqual(p("辛丑"));
  });

  // 2025 입춘: 2025-02-03 23:10 KST
  it("2025 입춘(2/3 23:10) 전후", () => {
    expect(calculateSaju(solar(2025, 2, 3, 22, 30)).year).toEqual(p("甲辰"));
    expect(calculateSaju(solar(2025, 2, 3, 23, 50)).year).toEqual(p("乙巳"));
  });

  it("2000-01-01 정오: 己卯 丙子 戊午 戊午", () => {
    const c = calculateSaju(solar(2000, 1, 1, 12, 0));
    expect([c.year, c.month, c.day, c.hour]).toEqual([p("己卯"), p("丙子"), p("戊午"), p("戊午")]);
  });
});

describe("일주·시주", () => {
  it("ganzhi 의 순수 계산과 일치", () => {
    const c = calculateSaju(solar(1990, 7, 15, 9, 30));
    expect(c.day).toEqual(dayPillar({ year: 1990, month: 7, day: 15 }));
    expect(c.hour?.branch).toBe("巳"); // 09:30 → 巳시
  });

  it("야자시 옵션", () => {
    const base = solar(2000, 1, 1, 23, 30); // 戊午일 23:30
    const same = calculateSaju(base);
    expect(same.day).toEqual(p("戊午"));
    expect(same.hour).toEqual(p("甲子"));

    const next = calculateSaju(base, { lateZiHour: "nextDay" });
    expect(next.day).toEqual(p("己未"));
    expect(next.hour).toEqual(p("甲子"));
  });

  it("시각을 모르면 시주는 null", () => {
    const c = calculateSaju(solar(2000, 1, 1));
    expect(c.hour).toBeNull();
    expect(c.day).toEqual(p("戊午"));
  });

  it("진태양시 보정은 일주·시주에만 영향을 준다", () => {
    // 2000-01-01 00:10 에서 -32분 → 전날 23:38 (戊午일 → 丁巳일)
    const corrected = calculateSaju(solar(2000, 1, 1, 0, 10), { timeOffsetMinutes: -32 });
    expect(corrected.day).toEqual(dayPillar(addDays({ year: 2000, month: 1, day: 1 }, -1)));
    // 연주·월주는 그대로
    const plain = calculateSaju(solar(2000, 1, 1, 0, 10));
    expect(corrected.year).toEqual(plain.year);
    expect(corrected.month).toEqual(plain.month);
  });
});

describe("시각을 모를 때 절기 당일 처리", () => {
  it("입춘 당일은 연주·월주가 불확실", () => {
    const c = calculateSaju(solar(2024, 2, 4));
    expect(c.uncertainPillars).toContain("year");
    expect(c.uncertainPillars).toContain("month");
  });

  it("평범한 날은 불확실하지 않다", () => {
    expect(calculateSaju(solar(2024, 5, 20)).uncertainPillars).toEqual([]);
  });

  it("시각을 알면 불확실 표시가 없다", () => {
    expect(calculateSaju(solar(2024, 2, 4, 18, 0)).uncertainPillars).toEqual([]);
  });
});

describe("음력 입력", () => {
  const lunar = (year: number, month: number, day: number, isLeapMonth = false): BirthInput => ({
    year,
    month,
    day,
    hour: 12,
    minute: 0,
    calendar: "lunar",
    isLeapMonth,
    gender: "female",
  });

  it("2023 음력 1월 1일 = 양력 2023-01-22", () => {
    expect(calculateSaju(lunar(2023, 1, 1)).solarDate).toEqual({ year: 2023, month: 1, day: 22 });
  });

  it("2023 윤2월 1일 = 양력 2023-03-22", () => {
    expect(calculateSaju(lunar(2023, 2, 1, true)).solarDate).toEqual({ year: 2023, month: 3, day: 22 });
  });

  it("윤달이 없는 달에 윤달로 입력하면 거부", () => {
    expect(() => calculateSaju(lunar(2023, 5, 1, true))).toThrow(SajuInputError);
  });

  it("음력 입력과 같은 날의 양력 입력은 같은 결과", () => {
    const a = calculateSaju(lunar(2023, 1, 1));
    const b = calculateSaju(solar(2023, 1, 22, 12, 0));
    expect([a.year, a.month, a.day, a.hour]).toEqual([b.year, b.month, b.day, b.hour]);
  });
});

describe("잘못된 입력", () => {
  const invalidCases: Array<[string, BirthInput]> = [
    ["존재하지 않는 양력 날짜", solar(2023, 2, 30, 12)],
    ["월 범위 초과", solar(2023, 13, 1, 12)],
    ["지원 범위 밖 연도", solar(1800, 1, 1, 12)],
    ["시 범위 초과", solar(2023, 1, 1, 24)],
    ["분 범위 초과", solar(2023, 1, 1, 12, 60)],
  ];

  it.each(invalidCases)("%s", (_label, input) => {
    expect(() => calculateSaju(input)).toThrow(SajuInputError);
  });

  it("잘못된 옵션", () => {
    expect(() => calculateSaju(solar(2023, 1, 1, 12), { timeOffsetMinutes: 1000 })).toThrow(SajuInputError);
  });
});

describe("경고 문구", () => {
  it("1987 서머타임 기간", () => {
    expect(calculateSaju(solar(1987, 7, 1, 12)).warnings.length).toBeGreaterThan(0);
  });
  it("일반 날짜는 경고 없음", () => {
    expect(calculateSaju(solar(2005, 7, 1, 12)).warnings).toEqual([]);
  });
});

describe("불변식: 라이브러리 결과가 간지 규칙을 지키는지 (1950~2050 전수 점검)", () => {
  const stemIdx = (pl: Pillar) => STEMS.findIndex((s) => s.hanja === pl.stem);
  const branchIdx = (pl: Pillar) => BRANCHES.findIndex((b) => b.hanja === pl.branch);

  it("월주 천간은 연간에서 오호둔으로 결정되고, 연주는 60갑자 규칙을 따른다", () => {
    let date = { year: 1950, month: 1, day: 1 };
    const end = { year: 2050, month: 12, day: 31 };
    const key = (d: { year: number; month: number; day: number }) => d.year * 10000 + d.month * 100 + d.day;

    while (key(date) <= key(end)) {
      const c = calculateSaju({ ...date, hour: 12, minute: 0, calendar: "solar", gender: "male" });

      // 월지는 인(寅)월부터 12개월 순환: k = 寅(2)에서 몇 칸 뒤인지
      const k = (branchIdx(c.month) - 2 + 12) % 12;
      const expectedMonthStem = ((stemIdx(c.year) % 5) * 2 + 2 + k) % 10;
      expect(stemIdx(c.month), `월주 천간 ${key(date)}`).toBe(expectedMonthStem);

      // 연주 천간·지지는 같은 해 번호에서 나오므로 (stem - 4) ≡ (branch - 4) mod 2 를 만족 (음양 짝)
      expect((stemIdx(c.year) + branchIdx(c.year)) % 2, `연주 음양 ${key(date)}`).toBe(0);
      expect((stemIdx(c.month) + branchIdx(c.month)) % 2, `월주 음양 ${key(date)}`).toBe(0);

      date = addDays(date, 1);
    }
  });
});

import { Lunar, Solar } from "lunar-typescript";
import { SajuInputError } from "./errors";
import { isValidDate, parsePillar, resolveDayAndHour, samePillar, shiftWallTime } from "./ganzhi";
import type { BirthInput, CalcOptions, CivilDate, Pillar, SajuChart, WallTime } from "./types";
import { koreaTimeWarnings } from "./warnings";

/**
 * 생년월일시로 사주 네 기둥(년·월·일·시주)을 계산합니다. 입력 시각은 한국 표준시(KST) 시계 기준입니다.
 *
 * 역할 분담
 * - 연주·월주: 절기(입춘, 경칩 …)가 바뀌는 "정확한 순간" 기준 → lunar-typescript 의 팔자(八字) 계산 사용
 * - 일주·시주: 달력 산술로 직접 계산 (ganzhi.ts)
 * - 음력 → 양력 변환: lunar-typescript
 *
 * 시간대 주의: lunar-typescript 는 절기 시각을 중국 표준시(UTC+8) 시계로 비교합니다.
 * 한국(UTC+9)은 1시간 빠르므로, 연주·월주를 구할 때는 입력 시각에서 1시간을 뺀 값을 넘깁니다.
 * (이걸 빼먹으면 절기 전후 1시간 안에 태어난 사람의 연주·월주가 틀립니다.)
 */

const KST_TO_CHINA_MINUTES = -60;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export function calculateSaju(input: BirthInput, options: CalcOptions = {}): SajuChart {
  const calendar = input.calendar ?? "solar";
  const lateZiHour = options.lateZiHour ?? "sameDay";
  const offset = options.timeOffsetMinutes ?? 0;

  if (lateZiHour !== "sameDay" && lateZiHour !== "nextDay") {
    throw new SajuInputError("야자시 옵션 값이 올바르지 않아요.");
  }
  if (!Number.isFinite(offset) || Math.abs(offset) > 180) {
    throw new SajuInputError("시간 보정 값이 올바르지 않아요.");
  }

  const timeKnown = input.hour !== undefined && input.hour !== null;
  const hour = timeKnown ? validateInt(input.hour, "태어난 시", 0, 23) : undefined;
  const minute = timeKnown ? validateInt(input.minute ?? 0, "태어난 분", 0, 59) : 0;

  const solarDate = calendar === "lunar" ? lunarToSolarDate(input) : validateSolarDate(input);
  const warnings = koreaTimeWarnings(solarDate);

  // 연주·월주: 실제 순간(표준시)으로 절기와 비교. 시각을 모르면 정오로 두고, 그날 안에서 값이 바뀌는지 따로 확인.
  const instant: WallTime = { ...solarDate, hour: hour ?? 12, minute };
  const byTerm = yearAndMonthPillars(instant);

  const uncertainPillars: Array<"year" | "month"> = [];
  if (!timeKnown) {
    const start = yearAndMonthPillars({ ...solarDate, hour: 0, minute: 0 });
    const end = yearAndMonthPillars({ ...solarDate, hour: 23, minute: 59 });
    if (!samePillar(start.year, end.year)) uncertainPillars.push("year");
    if (!samePillar(start.month, end.month)) uncertainPillars.push("month");
  }

  // 일주·시주: 시계 시각(+선택적 보정) 기준
  let dayHour: { day: Pillar; hour: Pillar | null };
  if (hour === undefined) {
    dayHour = resolveDayAndHour(solarDate, undefined, lateZiHour);
  } else {
    const local = shiftWallTime({ ...solarDate, hour, minute }, offset);
    dayHour = resolveDayAndHour(local, local.hour, lateZiHour);
  }

  return {
    year: byTerm.year,
    month: byTerm.month,
    day: dayHour.day,
    hour: dayHour.hour,
    solarDate,
    uncertainPillars,
    warnings,
  };
}

function yearAndMonthPillars(kst: WallTime): { year: Pillar; month: Pillar } {
  const c = shiftWallTime(kst, KST_TO_CHINA_MINUTES);
  const eightChar = Solar.fromYmdHms(c.year, c.month, c.day, c.hour, c.minute, 0).getLunar().getEightChar();
  return { year: parsePillar(eightChar.getYear()), month: parsePillar(eightChar.getMonth()) };
}

function validateInt(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new SajuInputError(`${label} 값이 올바르지 않아요.`);
  }
  return value;
}

function validateSolarDate(input: BirthInput): CivilDate {
  const year = validateInt(input.year, "연도", MIN_YEAR, MAX_YEAR);
  const month = validateInt(input.month, "월", 1, 12);
  const day = validateInt(input.day, "일", 1, 31);
  if (!isValidDate(year, month, day)) {
    throw new SajuInputError("존재하지 않는 날짜예요.");
  }
  return { year, month, day };
}

function lunarToSolarDate(input: BirthInput): CivilDate {
  const year = validateInt(input.year, "연도", MIN_YEAR, MAX_YEAR);
  const month = validateInt(input.month, "월", 1, 12);
  const day = validateInt(input.day, "일", 1, 30);

  // lunar-typescript 에서 윤달은 음수 월로 표현합니다. (윤2월 = -2)
  const monthArg = input.isLeapMonth ? -month : month;
  const notFound = new SajuInputError("존재하지 않는 음력 날짜예요. (윤달 여부와 그 달의 말일을 확인해 주세요)");

  try {
    const lunar = Lunar.fromYmd(year, monthArg, day);
    const solar = lunar.getSolar();
    // 29일까지인 달의 30일, 윤달이 없는 해의 윤달처럼 없는 날짜는 라이브러리가 조용히 다른 날짜로
    // 넘기는 경우가 있어서, 양력 → 음력으로 되돌려 입력과 같은지 확인합니다.
    const back = solar.getLunar();
    if (back.getYear() !== year || back.getMonth() !== monthArg || back.getDay() !== day) {
      throw notFound;
    }
    return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
  } catch (err) {
    if (err instanceof SajuInputError) throw err;
    throw notFound;
  }
}

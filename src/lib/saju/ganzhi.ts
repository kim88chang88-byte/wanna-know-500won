import { BRANCHES, STEMS } from "./constants";
import type { CivilDate, Pillar, WallTime } from "./types";

/*
 * 외부 라이브러리 없이 계산하는 순수 함수들입니다.
 * 일주·시주는 천문 계산이 필요 없고 달력 산술만으로 정확히 구할 수 있습니다.
 */

/** 실제로 존재하는 양력(그레고리력) 날짜인지. 1900년 이상에서만 사용하세요. */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** 시계 시각에 분을 더하거나 뺍니다. (시간대 변환 없이 단순 산술) */
export function shiftWallTime(wall: WallTime, minutes: number): WallTime {
  const d = new Date(Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute) + minutes * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** 율리우스 일수(JDN). 그레고리력 날짜 → 정수 일수 */
export function julianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** 60갑자 인덱스(0=甲子 … 59=癸亥) */
export function pillarFromIndex(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  return { stem: STEMS[i % 10].hanja, branch: BRANCHES[i % 12].hanja };
}

/** 그 날짜의 일주 60갑자 인덱스. (예: 2000-01-01 → 54 = 戊午) */
export function dayIndex(date: CivilDate): number {
  const jdn = julianDayNumber(date.year, date.month, date.day);
  return (((jdn + 49) % 60) + 60) % 60;
}

export function dayPillar(date: CivilDate): Pillar {
  return pillarFromIndex(dayIndex(date));
}

/** 시지 인덱스. 23:00~00:59 → 子(0), 01:00~02:59 → 丑(1) … */
export function hourBranchIndex(hour: number): number {
  return Math.floor((hour + 1) / 2) % 12;
}

/** 일간 인덱스와 시각으로 시주를 구합니다. (오서둔: 갑·기일은 甲子시부터, 을·경일은 丙子시부터 …) */
export function hourPillar(dayStemIndex: number, hour: number): Pillar {
  const branch = hourBranchIndex(hour);
  const stem = ((dayStemIndex % 5) * 2 + branch) % 10;
  return { stem: STEMS[stem].hanja, branch: BRANCHES[branch].hanja };
}

/**
 * 일주와 시주를 함께 구합니다. hour 가 없으면 시주는 null.
 * 23:00~23:59 는 두 방식 모두 시주의 천간을 "다음 날 일간" 기준으로 씁니다.
 */
export function resolveDayAndHour(
  date: CivilDate,
  hour: number | undefined,
  lateZiHour: "sameDay" | "nextDay",
): { day: Pillar; hour: Pillar | null } {
  if (hour === undefined) return { day: dayPillar(date), hour: null };

  const isLateZi = hour >= 23;
  const next = addDays(date, 1);
  const day = dayPillar(isLateZi && lateZiHour === "nextDay" ? next : date);
  const stemDay = isLateZi ? next : date;
  return { day, hour: hourPillar(dayIndex(stemDay) % 10, hour) };
}

/** "甲子" 같은 두 글자 문자열을 Pillar 로. 천간/지지가 아니면 오류. */
export function parsePillar(text: string): Pillar {
  const chars = Array.from(text);
  const stem = chars[0];
  const branch = chars[1];
  if (chars.length !== 2 || !STEMS.some((s) => s.hanja === stem) || !BRANCHES.some((b) => b.hanja === branch)) {
    throw new Error(`간지 형식이 올바르지 않습니다: "${text}"`);
  }
  return { stem, branch };
}

export function samePillar(a: Pillar, b: Pillar): boolean {
  return a.stem === b.stem && a.branch === b.branch;
}

/** 화면 표시용: { 甲, 子 } → "갑자(甲子)" */
export function formatPillar(p: Pillar): string {
  const stem = STEMS.find((s) => s.hanja === p.stem);
  const branch = BRANCHES.find((b) => b.hanja === p.branch);
  return `${stem?.hangul ?? "?"}${branch?.hangul ?? "?"}(${p.stem}${p.branch})`;
}

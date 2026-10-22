import { calculateSaju } from "./calculate";
import { samePillar, shiftWallTime } from "./ganzhi";
import type { BirthInput } from "./types";

/*
 * 출생지(경도) 보정. 한국 표준시는 동경 135도 기준이라, 서울(약 127도)은 실제 태양 시각이 30분 남짓 늦어요.
 * 그래서 출생지를 고르면 시계 시각에서 경도 차이만큼(1도 = 4분) 빼서 일주·시주를 다시 봐요.
 * - 균시차(계절별 오차)는 쓰지 않아요. "출생지 경도 보정"까지만 해요.
 * - 고르지 않으면 보정하지 않아요. (기존 결과 그대로)
 * - 보정 때문에 연주·월주(절기 경계)가 바뀌는 경우엔 보정하지 않고 안내만 해요.
 */

export const BIRTH_PLACES: readonly { name: string; lng: number }[] = [
  { name: "서울", lng: 126.98 },
  { name: "인천", lng: 126.7 },
  { name: "수원", lng: 127.03 },
  { name: "천안", lng: 127.11 },
  { name: "세종", lng: 127.29 },
  { name: "대전", lng: 127.39 },
  { name: "청주", lng: 127.49 },
  { name: "춘천", lng: 127.73 },
  { name: "원주", lng: 127.95 },
  { name: "강릉", lng: 128.9 },
  { name: "대구", lng: 128.6 },
  { name: "안동", lng: 128.73 },
  { name: "포항", lng: 129.37 },
  { name: "울산", lng: 129.31 },
  { name: "부산", lng: 129.08 },
  { name: "창원", lng: 128.68 },
  { name: "광주", lng: 126.85 },
  { name: "목포", lng: 126.39 },
  { name: "여수", lng: 127.66 },
  { name: "전주", lng: 127.15 },
  { name: "군산", lng: 126.74 },
  { name: "제주", lng: 126.53 },
];

export function isBirthPlace(v: unknown): v is string {
  return typeof v === "string" && BIRTH_PLACES.some((p) => p.name === v);
}

/** 1954-03-21 ~ 1961-08-09 는 표준시 기준이 동경 127.5도였어요. */
function meridianFor(y: number, m: number, d: number): number {
  const n = y * 10000 + m * 100 + d;
  return n >= 19540321 && n <= 19610809 ? 127.5 : 135;
}

/** 출생지·날짜로 시계 시각에 더할 분(대개 음수). 모르는 곳이면 null. */
export function placeOffsetMinutes(place: string, y: number, m: number, d: number): number | null {
  const p = BIRTH_PLACES.find((x) => x.name === place);
  if (!p) return null;
  return Math.round((p.lng - meridianFor(y, m, d)) * 4);
}

export interface BirthAdjust {
  label: string;
  minutes: number;
  applied: boolean;
  hourChanged: boolean;
  dayChanged: boolean;
  /** 조자시(23시부터 다음 날)로 본 경우 */
  lateZi?: boolean;
  reason?: string;
}

/**
 * 출생지·조자시 선택을 반영한 양력 입력으로 바꿔요. 돌려주는 input 에는 birthPlace/lateZi 가 없어요.
 * 시간을 모르거나 보정할 게 없으면 그대로 돌려줘요(adjust 는 null).
 * 보정 때문에 연주·월주(절기 경계)가 바뀌면 보정하지 않고 이유만 알려줘요.
 */
export function resolveBirth<T extends BirthInput>(input: T): { input: Omit<T, "birthPlace" | "lateZi">; adjust: BirthAdjust | null } {
  const { birthPlace, lateZi, ...base } = input;
  const timeKnown = base.hour !== undefined && base.hour !== null;
  const placeOk = isBirthPlace(birthPlace);
  const wantLate = lateZi === "nextDay";
  if (!timeKnown || (!placeOk && !wantLate)) return { input: base, adjust: null };
  try {
    const chart0 = calculateSaju(base);
    const sd = chart0.solarDate;
    const minutes = placeOk ? (placeOffsetMinutes(birthPlace, sd.year, sd.month, sd.day) ?? 0) : 0;
    let wall = shiftWallTime({ ...sd, hour: base.hour as number, minute: base.minute ?? 0 }, minutes);
    let late = false;
    if (wantLate && wall.hour === 23) {
      // 조자시: 23시부터 다음 날 자시(00:00)로 봐요. 시주는 같고 일주만 다음 날이 돼요.
      wall = shiftWallTime(wall, 60 - wall.minute);
      late = true;
    }
    if (minutes === 0 && !late) return { input: base, adjust: null };
    const parts = [placeOk && minutes !== 0 ? `${birthPlace} ${minutes > 0 ? "+" : "−"}${Math.abs(minutes)}분` : "", late ? "조자시" : ""].filter(Boolean);
    const label = parts.join(" · ");
    const shiftedInput = { ...base, year: wall.year, month: wall.month, day: wall.day, hour: wall.hour, minute: wall.minute, calendar: "solar" as const, isLeapMonth: false } as Omit<T, "birthPlace" | "lateZi">;
    const chart1 = calculateSaju(shiftedInput);
    if (!samePillar(chart0.year, chart1.year) || !samePillar(chart0.month, chart1.month)) {
      return {
        input: base,
        adjust: { label, minutes, applied: false, hourChanged: false, dayChanged: false, reason: "보정하면 절기가 바뀌는 시각이라, 시계 시각 그대로 봤어요." },
      };
    }
    const hourChanged = !!chart0.hour && !!chart1.hour && !samePillar(chart0.hour, chart1.hour);
    const dayChanged = !samePillar(chart0.day, chart1.day);
    return { input: shiftedInput, adjust: { label, minutes, applied: true, hourChanged, dayChanged, lateZi: late || undefined } };
  } catch {
    return { input: base, adjust: null };
  }
}

/** 화면에 보여줄 한 줄 안내 */
export function adjustNote(a: BirthAdjust): string {
  if (!a.applied) return `📍 ${a.label}: ${a.reason ?? "보정하지 않았어요."}`;
  if (a.dayChanged) return `📍 ${a.label} 보정을 적용했어요. 날짜 기둥(일주)과 시주가 달라졌어요.`;
  if (a.hourChanged) return `📍 ${a.label} 보정을 적용했어요. 시주가 달라졌어요.`;
  return `📍 ${a.label} 보정을 적용했지만 사주 글자는 그대로예요.`;
}

/**
 * 절기가 바뀌는 날 근처에 태어났는지 살펴서 안내 문구를 돌려줘요. 아니면 null.
 * - 시간을 모르면: 그날 안에서 연주/월주가 바뀌는지(uncertainPillars)
 * - 시간을 알면: 앞뒤 2시간 안에 절기가 바뀌는지
 */
export function boundaryNote(input: BirthInput): string | null {
  try {
    const { birthPlace: _p, lateZi: _l, ...base } = input;
    const chart = calculateSaju(base);
    const timeKnown = base.hour !== undefined && base.hour !== null;
    if (!timeKnown) {
      if (chart.uncertainPillars.length === 0) return null;
      const what = chart.uncertainPillars.includes("year") ? "해(연주)와 달(월주)" : "달(월주)";
      return `🗓 태어난 날에 절기가 바뀌어서, 시간을 모르면 ${what}이 확정되지 않아요. 시간을 알면 더 정확해져요.`;
    }
    const sd = chart.solarDate;
    const at = shiftWallTime({ ...sd, hour: base.hour as number, minute: base.minute ?? 0 }, 0);
    const near = [-120, 120].some((d) => {
      const w = shiftWallTime(at, d);
      const c = calculateSaju({ ...base, year: w.year, month: w.month, day: w.day, hour: w.hour, minute: w.minute, calendar: "solar", isLeapMonth: false });
      return !samePillar(c.year, chart.year) || !samePillar(c.month, chart.month);
    });
    return near ? "🗓 절기가 바뀌는 시각과 가까워서, 몇 시간 차이로 달(월주)이 달라질 수 있어요. 출생 시각이 정확한지 한 번 확인해 보면 좋아요." : null;
  } catch {
    return null;
  }
}

import type { BirthInput, Gender } from "@/lib/saju/types";

/** 생년월일시 입력 화면(도리 질문 4단계)의 입력값과 검사 규칙입니다. 화면 없이 테스트할 수 있게 따로 뒀어요. */

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export type StepId = "date" | "time" | "gender" | "consent";
export const STEPS: readonly StepId[] = ["date", "time", "gender", "consent"];

export interface IntakeForm {
  calendar: "solar" | "lunar";
  /** 양력 입력 (달력 입력창 값, 예: "1990-05-17") */
  solarDate: string;
  /** 음력은 달력 입력창으로 "2월 30일" 같은 날짜를 고를 수 없어서 숫자로 받아요 */
  lunarYear: string;
  lunarMonth: string;
  lunarDay: string;
  isLeapMonth: boolean;
  /** 태어난 시간을 모르면 false */
  timeKnown: boolean;
  /** "HH:MM" */
  time: string;
  gender: Gender | null;
  consent: boolean;
}

export const EMPTY_FORM: IntakeForm = {
  calendar: "solar",
  solarDate: "",
  lunarYear: "",
  lunarMonth: "",
  lunarDay: "",
  isLeapMonth: false,
  timeKnown: true,
  time: "",
  gender: null,
  consent: false,
};

function toInt(v: string): number | null {
  return /^\d+$/.test(v.trim()) ? Number(v.trim()) : null;
}

/** 실제로 있는 양력 날짜인지 (2월 30일 같은 날짜 거르기) */
function isRealSolarDate(y: number, m: number, d: number): boolean {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function parseSolar(v: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function parseTime(v: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(v);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** 한 단계의 입력이 올바른지 검사해서, 문제가 있으면 안내 문구를, 괜찮으면 null 을 돌려줘요. */
export function validateStep(step: StepId, f: IntakeForm): string | null {
  switch (step) {
    case "date": {
      if (f.calendar === "solar") {
        const p = parseSolar(f.solarDate);
        if (!p) return "생년월일을 골라줘요.";
        if (p.y < MIN_YEAR || p.y > MAX_YEAR) return `${MIN_YEAR}년부터 ${MAX_YEAR}년까지만 볼 수 있어요.`;
        if (!isRealSolarDate(p.y, p.m, p.d)) return "없는 날짜예요. 다시 확인해줘요.";
        return null;
      }
      const y = toInt(f.lunarYear);
      const m = toInt(f.lunarMonth);
      const d = toInt(f.lunarDay);
      if (y === null || m === null || d === null) return "음력 연·월·일을 모두 숫자로 적어줘요.";
      if (y < MIN_YEAR || y > MAX_YEAR) return `${MIN_YEAR}년부터 ${MAX_YEAR}년까지만 볼 수 있어요.`;
      if (m < 1 || m > 12) return "음력 월은 1~12 사이예요.";
      if (d < 1 || d > 30) return "음력 일은 1~30 사이예요.";
      return null;
    }
    case "time":
      if (!f.timeKnown) return null;
      return parseTime(f.time) ? null : "태어난 시간을 골라줘요. 모르면 '모르겠어요'를 눌러도 돼요.";
    case "gender":
      return f.gender ? null : "성별을 골라줘요.";
    case "consent":
      return f.consent ? null : "개인정보 처리에 동의해야 캡슐을 만들 수 있어요.";
  }
}

/** 모든 단계가 올바를 때 만세력 계산에 넘길 입력으로 바꿔요. 올바르지 않으면 null. */
export function buildBirthInput(f: IntakeForm): BirthInput | null {
  if (STEPS.some((s) => validateStep(s, f) !== null) || !f.gender) return null;

  let year: number;
  let month: number;
  let day: number;
  if (f.calendar === "solar") {
    const p = parseSolar(f.solarDate)!;
    ({ y: year, m: month, d: day } = p);
  } else {
    year = toInt(f.lunarYear)!;
    month = toInt(f.lunarMonth)!;
    day = toInt(f.lunarDay)!;
  }

  const t = f.timeKnown ? parseTime(f.time) : null;
  return {
    year,
    month,
    day,
    hour: t ? t.hour : null,
    minute: t ? t.minute : null,
    calendar: f.calendar,
    isLeapMonth: f.calendar === "lunar" && f.isLeapMonth,
    gender: f.gender,
  };
}

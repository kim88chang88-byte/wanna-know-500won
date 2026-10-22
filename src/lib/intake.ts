import { cleanConcernText, MAX_CONCERN_TAGS, MAX_CONCERN_TEXT, type Concern, type ConcernId } from "@/lib/concerns";
import { isBirthPlace } from "@/lib/saju/birthPlace";
import type { BirthInput, Gender } from "@/lib/saju/types";

/** 생년월일시 입력 화면(도리 질문 5단계)의 입력값과 검사 규칙입니다. 화면 없이 테스트할 수 있게 따로 뒀어요. */

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export type StepId = "date" | "time" | "gender" | "concern" | "consent";
export const STEPS: readonly StepId[] = ["date", "time", "gender", "concern", "consent"];

/** 궁합 리포트에서 상대방 생년월일시를 받는 단계 (내 성별 다음, 고민 앞) */
export type PartnerStepId = "pdate" | "ptime" | "pgender";
export type AnyStepId = StepId | PartnerStepId;
export const COMPAT_STEPS: readonly AnyStepId[] = ["date", "time", "gender", "pdate", "ptime", "pgender", "concern", "consent"];

/** 한 사람의 생년월일시·성별 입력값 (상대방은 이것만 받아요) */
export type BirthFields = Pick<IntakeForm, "calendar" | "solarDate" | "lunarYear" | "lunarMonth" | "lunarDay" | "isLeapMonth" | "timeKnown" | "time" | "gender" | "birthPlace" | "lateZi">;

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
  /** 출생지 (선택, 시간을 알 때만 의미 있어요) */
  birthPlace: string;
  /** 23시대 출생일 때 야자시(sameDay) / 조자시(nextDay) */
  lateZi: "sameDay" | "nextDay";
  gender: Gender | null;
  /** 요즘 고민 (선택): 추천 버튼 + 직접 적기 */
  concernTags: ConcernId[];
  concernText: string;
  consent: boolean;
}

export const EMPTY_BIRTH: BirthFields = {
  calendar: "solar",
  solarDate: "",
  lunarYear: "",
  lunarMonth: "",
  lunarDay: "",
  isLeapMonth: false,
  timeKnown: true,
  time: "",
  birthPlace: "",
  lateZi: "sameDay",
  gender: null,
};

export const EMPTY_FORM: IntakeForm = {
  calendar: "solar",
  solarDate: "",
  lunarYear: "",
  lunarMonth: "",
  lunarDay: "",
  isLeapMonth: false,
  timeKnown: true,
  time: "",
  birthPlace: "",
  lateZi: "sameDay",
  gender: null,
  concernTags: [],
  concernText: "",
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
    case "concern":
      if (f.concernTags.length > MAX_CONCERN_TAGS) return `고민 버튼은 ${MAX_CONCERN_TAGS}개까지 고를 수 있어요.`;
      if (f.concernText.length > MAX_CONCERN_TEXT) return `고민은 ${MAX_CONCERN_TEXT}자까지 적을 수 있어요.`;
      return null;
    case "consent":
      return f.consent ? null : "개인정보 처리에 동의해야 풀이를 볼 수 있어요.";
  }
}

/** 상대방 단계(pdate/ptime/pgender)를 같은 규칙으로 검사해요. 일반 단계는 그대로 검사해요. */
export function validatePartnerStep(step: PartnerStepId, p: BirthFields): string | null {
  const base: Record<PartnerStepId, StepId> = { pdate: "date", ptime: "time", pgender: "gender" };
  return validateStep(base[step], { ...EMPTY_FORM, ...p });
}

/** 한 사람의 날짜·시간·성별이 모두 올바르면 계산 입력으로 바꿔요. 아니면 null. */
export function buildBirthFields(f: BirthFields): BirthInput | null {
  const full: IntakeForm = { ...EMPTY_FORM, ...f };
  if ((["date", "time", "gender"] as const).some((s) => validateStep(s, full) !== null) || !f.gender) return null;

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
    ...(t && isBirthPlace(f.birthPlace) ? { birthPlace: f.birthPlace } : {}),
    ...(t && f.lateZi === "nextDay" ? { lateZi: "nextDay" as const } : {}),
  };
}

/** 모든 단계가 올바를 때 만세력 계산에 넘길 입력으로 바꿔요. 올바르지 않으면 null. */
export function buildBirthInput(f: IntakeForm): BirthInput | null {
  if (STEPS.some((s) => validateStep(s, f) !== null)) return null;
  return buildBirthFields(f);
}

/** 고민 단계의 입력을 서버로 보낼 모양으로 바꿔요. 아무것도 안 골랐으면 null. */
export function buildConcern(f: IntakeForm): Concern | null {
  const c: Concern = { tags: f.concernTags.slice(0, MAX_CONCERN_TAGS), text: cleanConcernText(f.concernText) };
  return c.tags.length > 0 || c.text.length > 0 ? c : null;
}

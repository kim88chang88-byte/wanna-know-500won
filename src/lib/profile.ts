import type { IntakeForm } from "@/lib/intake";
import type { BirthInput } from "@/lib/saju/types";
import { kstDay } from "@/lib/db/kst";

/**
 * 로그인한 회원이 "기억해 주세요"에 동의했을 때 저장하는 생년월일시예요. (BirthInput 과 같은 모양)
 * 브라우저로 내려가는 것은 본인 것뿐이고, 회원번호는 함께 내려가지 않아요.
 */
export type SavedProfile = BirthInput;

const pad = (n: number) => String(n).padStart(2, "0");

/** 저장된 값으로 질문지를 미리 채워요. */
export function profileToForm(p: SavedProfile): Pick<IntakeForm, "calendar" | "solarDate" | "lunarYear" | "lunarMonth" | "lunarDay" | "isLeapMonth" | "timeKnown" | "time" | "gender"> {
  const known = p.hour !== null && p.hour !== undefined;
  const solar = p.calendar === "solar";
  return {
    calendar: p.calendar,
    solarDate: solar ? `${p.year}-${pad(p.month)}-${pad(p.day)}` : "",
    lunarYear: solar ? "" : String(p.year),
    lunarMonth: solar ? "" : String(p.month),
    lunarDay: solar ? "" : String(p.day),
    isLeapMonth: !solar && p.isLeapMonth === true,
    timeKnown: known,
    time: known ? `${pad(p.hour as number)}:${pad(p.minute ?? 0)}` : "",
    gender: p.gender,
  };
}

/** "1995.03.14 (양력) 09:30 · 여성" 같은 한 줄 요약 (마이페이지와 질문지에서 써요) */
export function profileSummary(p: SavedProfile): string {
  const cal = p.calendar === "lunar" ? `음력${p.isLeapMonth ? " 윤달" : ""}` : "양력";
  const time = p.hour !== null && p.hour !== undefined ? `${pad(p.hour)}:${pad(p.minute ?? 0)}` : "시간 모름";
  return `${p.year}.${pad(p.month)}.${pad(p.day)} (${cal}) ${time} · ${p.gender === "female" ? "여성" : "남성"}`;
}

/** 통계용 나이대 (예: "20s"). 생년월일 자체는 통계에 남기지 않아요. */
export function ageBand(birthYear: number, now: Date = new Date()): string {
  const age = Number(kstDay(now).slice(0, 4)) - birthYear;
  if (age < 10) return "0s";
  if (age >= 60) return "60s+";
  return `${Math.floor(age / 10) * 10}s`;
}

/** DB 행(또는 외부 입력)을 검사해서 SavedProfile 로 바꿔요. 이상하면 null. */
export function parseProfileRow(row: unknown): SavedProfile | null {
  if (typeof row !== "object" || row === null) return null;
  const r = row as Record<string, unknown>;
  const int = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : null);
  const year = int(r.year);
  const month = int(r.month);
  const day = int(r.day);
  if (year === null || month === null || day === null) return null;
  if (r.calendar !== "solar" && r.calendar !== "lunar") return null;
  if (r.gender !== "female" && r.gender !== "male") return null;
  const hour = r.hour === null || r.hour === undefined ? null : int(r.hour);
  const minute = r.minute === null || r.minute === undefined ? null : int(r.minute);
  if (hour !== null && (hour < 0 || hour > 23)) return null;
  if (minute !== null && (minute < 0 || minute > 59)) return null;
  return { year, month, day, hour, minute: hour === null ? null : (minute ?? 0), calendar: r.calendar, isLeapMonth: r.calendar === "lunar" && (r.is_leap === true || r.isLeapMonth === true), gender: r.gender };
}

/** 두 생년월일시가 같은 값인지 (저장된 정보를 고쳤는지 확인할 때 써요) */
export function sameBirth(a: SavedProfile | null, b: SavedProfile | null): boolean {
  if (!a || !b) return false;
  const hk = (p: SavedProfile) => (p.hour === null || p.hour === undefined ? "x" : `${p.hour}:${p.minute ?? 0}`);
  return a.calendar === b.calendar && a.year === b.year && a.month === b.month && a.day === b.day && hk(a) === hk(b) && a.gender === b.gender && (a.calendar === "solar" || (a.isLeapMonth === true) === (b.isLeapMonth === true));
}

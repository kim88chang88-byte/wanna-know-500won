/*
 * "오늘 뽑기 횟수 / 이번달 누적 뽑기 횟수"를 이 기기(브라우저)에서만 세는 간단한 카운터입니다.
 * 서버나 다른 기기와는 공유되지 않아요. 저장소가 막혀 있어도(시크릿 모드 등) 오류 없이 동작합니다.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DrawCounts {
  today: number;
  month: number;
}

interface Stored {
  day: string;
  today: number;
  month: string;
  monthCount: number;
}

export const STORAGE_KEY = "wanna500:draws:v1";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 기기의 현지 날짜 기준 "2026-10-16" */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 기기의 현지 날짜 기준 "2026-10" */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function isCount(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Stored> | null;
    if (
      v &&
      typeof v.day === "string" &&
      typeof v.month === "string" &&
      isCount(v.today) &&
      isCount(v.monthCount)
    ) {
      return { day: v.day, today: v.today, month: v.month, monthCount: v.monthCount };
    }
  } catch {
    // 깨진 값은 없는 것으로 취급
  }
  return null;
}

/** 날짜가 바뀌었으면 오늘 횟수를, 달이 바뀌었으면 이번 달 횟수를 0으로 되돌립니다. */
function rolled(stored: Stored | null, now: Date): Stored {
  const day = dayKey(now);
  const month = monthKey(now);
  const base = stored ?? { day, today: 0, month, monthCount: 0 };
  return {
    day,
    today: base.day === day ? base.today : 0,
    month,
    monthCount: base.month === month ? base.monthCount : 0,
  };
}

function load(storage: StorageLike | null): { ok: boolean; raw: string | null } {
  if (!storage) return { ok: false, raw: null };
  try {
    return { ok: true, raw: storage.getItem(STORAGE_KEY) };
  } catch {
    return { ok: false, raw: null };
  }
}

export function readCounts(storage: StorageLike | null, now: Date): DrawCounts {
  const r = rolled(parse(load(storage).raw), now);
  return { today: r.today, month: r.monthCount };
}

/**
 * 뽑기 1회를 기록하고 새 횟수를 돌려줍니다.
 * 저장소를 못 쓰는 환경이면 `current`(화면에 보이던 값)에서 1을 더해서 이번 방문 동안만 유지합니다.
 */
export function recordDraw(
  storage: StorageLike | null,
  now: Date,
  current: DrawCounts = { today: 0, month: 0 },
): DrawCounts {
  const { ok, raw } = load(storage);
  const day = dayKey(now);
  const month = monthKey(now);
  const base: Stored = ok
    ? rolled(parse(raw), now)
    : { day, today: current.today, month, monthCount: current.month };

  const next: Stored = { ...base, today: base.today + 1, monthCount: base.monthCount + 1 };
  if (ok && storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장 실패는 무시 (화면 값만 갱신)
    }
  }
  return { today: next.today, month: next.monthCount };
}

/** 브라우저에서만 호출하세요. 접근이 막혀 있으면 null. */
export function getBrowserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

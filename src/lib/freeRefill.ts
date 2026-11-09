/*
 * 무료 뽑기 충전(매일 한국 시간 00시)과 관련된 계산:
 *  - 다음 충전까지 남은 시간(시계 표시)
 *  - 어제 무료를 다 쓰고 간 사람이 새 날에 다시 들어왔을 때 "충전됐어요" 알림을 한 번만 띄울지
 * 무료 뽑기는 쌓이지 않아요. 날짜가 바뀌면 "오늘 쓴 횟수"가 0이 되어 하루 1회가 다시 열릴 뿐이에요.
 */
export const REFILL_KEY = "wanna500:free-refill:v1";
const KST = 9 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;

/** KST 날짜 "2026-11-10" */
export function kstDayOf(now: number): string {
  return new Date(now + KST).toISOString().slice(0, 10);
}

/** 다음 한국 시간 00시까지 남은 밀리초 (항상 1 이상 DAY 이하) */
export function msUntilKstMidnight(now: number): number {
  const shifted = now + KST;
  const next = Math.floor(shifted / DAY) * DAY + DAY;
  return next - shifted;
}

/** 07:42:10 모양. 1초 미만은 올려서 00:00:01 로 보여줘요. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export interface RefillRecord {
  /** 마지막으로 확인한 KST 날짜 */
  day: string;
  /** 그날 무료 뽑기를 다 쓴 상태였는지 */
  out: boolean;
  /** 어느 회원의 기록인지 */
  tag: string;
}

export function parseRefill(raw: string | null): RefillRecord | null {
  try {
    const v = JSON.parse(raw ?? "null") as Partial<RefillRecord> | null;
    if (v && typeof v.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && typeof v.out === "boolean" && typeof v.tag === "string") {
      return { day: v.day, out: v.out, tag: v.tag };
    }
  } catch {
    /* 깨진 값은 없는 것으로 */
  }
  return null;
}

/**
 * prev: 지난번에 적어 둔 기록, today: 오늘(KST), outNow: 지금 무료를 다 쓴 상태인지.
 * 알림은 "지난 기록이 더 이전 날짜이고 그날 다 쓴 상태였고, 오늘은 아직 무료가 남아 있을 때"만 한 번 띄워요.
 */
export function checkRefill(prev: RefillRecord | null, tag: string, today: string, outNow: boolean): { show: boolean; next: RefillRecord } {
  const next: RefillRecord = { day: today, out: outNow, tag };
  // 같은 날 안에서는 "다 썼음"을 유지해요 (나중에 하나라도 썼다면 그날은 다 쓴 날)
  if (prev && prev.tag === tag && prev.day === today) next.out = prev.out || outNow;
  const show = Boolean(prev && prev.tag === tag && prev.day < today && prev.out && !outNow);
  return { show, next };
}

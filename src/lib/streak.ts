/*
 * 연속 방문 '물길'. 이 기기(브라우저)에서만 세요. 서버로 보내지 않아요.
 * 부담이 되지 않도록 하루 건너뛰어도(7일에 한 번) 물길은 이어져요. 결과를 받은 날만 방문으로 세요.
 */

import type { StorageLike } from "./drawCounter";

export const STREAK_KEY = "wanna500:streak:v1";
const MAX_DAYS = 400;

export interface StreakState {
  /** 지금 이어지고 있는 물길의 방문 일수. 끊겼으면 0 */
  count: number;
  /** 지금까지의 최고 기록 */
  best: number;
  /** 오늘 이미 방문했는지 */
  doneToday: boolean;
  /** 어제를 건너뛰었지만 물길이 아직 이어져 있는지 (오늘 오면 이어요) */
  resting: boolean;
  /** 쉬어 가기가 이번 물길에서 쓰였는지 */
  restUsed: boolean;
}

const dayNum = (d: string): number => {
  const [y, m, dd] = d.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, dd) / 86_400_000);
};

const VALID = /^\d{4}-\d{2}-\d{2}$/;

/** 방문한 날(YYYY-MM-DD)들로 물길 상태를 계산해요. 순수 함수라 테스트하기 쉬워요. */
export function computeStreak(visitDays: string[], today: string): StreakState {
  const days = [...new Set(visitDays.filter((d) => VALID.test(d) && d <= today))].sort();
  if (days.length === 0) return { count: 0, best: 0, doneToday: false, resting: false, restUsed: false };

  let best = 0;
  let count = 0;
  let restUsed = false;
  let lastRest = -Infinity; // 마지막으로 쉬어 간 날(번호)
  let prev = -Infinity;
  for (const d of days) {
    const n = dayNum(d);
    const gap = n - prev;
    if (gap === 1) {
      count++;
    } else if (gap === 2 && n - 1 - lastRest >= 7) {
      count++;
      lastRest = n - 1;
      restUsed = true;
    } else {
      count = 1;
      restUsed = false;
      lastRest = -Infinity;
    }
    prev = n;
    if (count > best) best = count;
  }

  const t = dayNum(today);
  const sinceLast = t - prev;
  const doneToday = sinceLast === 0;
  // 마지막 방문이 어제면 오늘 오면 이어져요. 그저께면 쉬어 가기가 남아 있을 때만 이어져요.
  let alive = doneToday || sinceLast === 1;
  let resting = false;
  if (!alive && sinceLast === 2 && t - 1 - lastRest >= 7) {
    alive = true;
    resting = true;
  }
  return { count: alive ? count : 0, best, doneToday, resting, restUsed: alive ? restUsed : false };
}

export const MILESTONES = [3, 7, 14, 30, 50, 100] as const;

const MILESTONE_COPY: Record<number, string> = {
  3: "3일째! 물길이 슬슬 이어지고 있어요 💧",
  7: "7일 연속! 도리가 칭찬 도장을 꾹 찍어 줬어요 ✦",
  14: "14일 연속! 도리와 어느새 단짝이 됐네요 🦦",
  30: "30일 연속! 한 달 내내 물길을 이어 온 정성이 멋져요 ✨",
  50: "50일 연속! 도리가 박수를 보내고 있어요 👏",
  100: "100일 연속! 도리 옹달샘의 명예 단골이에요 🏅",
};

/** 오늘 화면에 보여 줄 한 줄. 부담 주지 않는 말투로. */
export function streakLine(s: StreakState): string | null {
  if (s.count === 0) return null;
  if (s.doneToday && (MILESTONES as readonly number[]).includes(s.count)) return MILESTONE_COPY[s.count];
  if (s.resting) return "어제는 쉬어 갔지만 물길은 그대로 이어져 있어요. 오늘 오면 계속 이어져요 💧";
  if (!s.doneToday) return `오늘 운세를 뽑으면 ${s.count + 1}일째가 돼요. 못 오는 날이 있어도 괜찮아요 🫧`;
  if (s.count >= 2) return `${s.count}일째 물길을 이어 가는 중이에요. 내일 또 만나요 💧`;
  return null;
}

function read(storage: StorageLike | null): string[] {
  if (!storage) return [];
  try {
    const v = JSON.parse(storage.getItem(STREAK_KEY) ?? "null") as { days?: unknown } | null;
    return Array.isArray(v?.days) ? (v!.days as unknown[]).filter((d): d is string => typeof d === "string" && VALID.test(d)) : [];
  } catch {
    return [];
  }
}

export function readStreak(storage: StorageLike | null, today: string): StreakState {
  return computeStreak(read(storage), today);
}

/** 오늘을 방문한 날로 기록하고 새 상태를 돌려줘요. 저장소를 못 써도 오류 없이 오늘 값만 계산해요. */
export function recordVisit(storage: StorageLike | null, today: string): StreakState {
  const days = read(storage);
  if (!days.includes(today)) days.push(today);
  const kept = [...new Set(days)].sort().slice(-MAX_DAYS);
  if (storage) {
    try {
      storage.setItem(STREAK_KEY, JSON.stringify({ days: kept }));
    } catch {
      /* 저장 실패는 무시 */
    }
  }
  return computeStreak(kept, today);
}

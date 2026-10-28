import type { StorageLike } from "./drawCounter";

/*
 * 도장 보너스: 도장을 3일 연속으로 찍으면 500원 무료 뽑기 1장(보너스 뽑기)을 선물해요.
 * 이 기기(브라우저)에서만 세요. 쉬어 가기 없이 실제로 하루도 빠짐없이 이어진 날만 연속으로 봐요.
 */

export const TICKET_KEY = "wanna500:tickets:v1";
export const STREAK_FOR_TICKET = 3;
const MAX_CLAIMED = 120;

interface Stored {
  balance: number;
  /** 이미 받은 보상 표시 ("연속이 시작된 날:번째") */
  claimed: string[];
}

const VALID = /^\d{4}-\d{2}-\d{2}$/;

const dayNum = (d: string): number => {
  const [y, m, dd] = d.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, dd) / 86_400_000);
};
const dayStr = (n: number): string => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** 오늘(오늘 도장이 없으면 어제)까지 이어진 연속 도장 수와 그 시작일 */
export function currentRun(visitDays: string[], today: string): { length: number; start: string | null; stampedToday: boolean } {
  const set = new Set(visitDays.filter((d) => VALID.test(d) && d <= today));
  const t = dayNum(today);
  const stampedToday = set.has(today);
  let end = stampedToday ? t : t - 1;
  if (!set.has(dayStr(end))) return { length: 0, start: null, stampedToday };
  let n = 0;
  while (set.has(dayStr(end - n))) n++;
  return { length: n, start: dayStr(end - n + 1), stampedToday };
}

function parse(raw: string | null): Stored {
  try {
    const v = JSON.parse(raw ?? "null") as Partial<Stored> | null;
    const balance = typeof v?.balance === "number" && Number.isInteger(v.balance) && v.balance >= 0 ? v.balance : 0;
    const claimed = Array.isArray(v?.claimed) ? v!.claimed.filter((x): x is string => typeof x === "string") : [];
    return { balance, claimed };
  } catch {
    return { balance: 0, claimed: [] };
  }
}

function load(storage: StorageLike | null): Stored {
  if (!storage) return { balance: 0, claimed: [] };
  try {
    return parse(storage.getItem(TICKET_KEY));
  } catch {
    return { balance: 0, claimed: [] };
  }
}

function save(storage: StorageLike | null, s: Stored) {
  if (!storage) return;
  try {
    storage.setItem(TICKET_KEY, JSON.stringify({ balance: s.balance, claimed: s.claimed.slice(-MAX_CLAIMED) }));
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function readTickets(storage: StorageLike | null): number {
  return load(storage).balance;
}

/** 연속 도장이 3일(6일, 9일…)을 채웠다면 보너스 뽑기를 지급하고, 이번에 새로 받은 장수와 보유 장수를 돌려줘요. */
export function grantTickets(storage: StorageLike | null, visitDays: string[], today: string): { earned: number; balance: number } {
  const st = load(storage);
  const run = currentRun(visitDays, today);
  let earned = 0;
  if (run.start) {
    const due = Math.floor(run.length / STREAK_FOR_TICKET);
    for (let k = 1; k <= due; k++) {
      const key = `${run.start}:${k}`;
      if (!st.claimed.includes(key)) {
        st.claimed.push(key);
        st.balance += 1;
        earned += 1;
      }
    }
  }
  if (earned > 0) save(storage, st);
  return { earned, balance: st.balance };
}

/** 보너스 뽑기 1장을 써요. 없으면 false */
export function spendTicket(storage: StorageLike | null): { ok: boolean; balance: number } {
  const st = load(storage);
  if (st.balance <= 0) return { ok: false, balance: 0 };
  st.balance -= 1;
  save(storage, st);
  return { ok: true, balance: st.balance };
}

import { createHash } from "node:crypto";
import { kstDay } from "@/lib/db/kst";
import type { ChatKind } from "@/lib/chatContext";
import type { BirthInput } from "@/lib/saju/types";

/*
 * 상담방 질문 횟수.
 *  - 오늘의 한마디 카드에서 들어오면: 하루(한국 시간) 3번 무료
 *  - 결과서(500원·1,000원)에서 들어오면: 그 사람(·두 사람) 결과마다 한 달에 10번 무료
 *  - 뽑기 코인 1장 = 질문 5개 (무료를 다 쓴 뒤에 쓰여요)
 * 그 밖에 한 사람이 하루에 보낼 수 있는 전체 질문 수에도 위쪽 한도(DAY_CAP)를 둬요.
 */
export const FREE_DAILY = 3;
export const FREE_RESULT = 10;
export const BUY_AMOUNT = 5;
export const DAY_CAP = 40;

export const freeFor = (kind: ChatKind): number => (kind === "daily" ? FREE_DAILY : FREE_RESULT);

function birthKey(b: BirthInput | null): string {
  if (!b) return "me";
  return [b.year, b.month, b.day, b.hour ?? "x", b.minute ?? 0, b.calendar, b.isLeapMonth ? 1 : 0, b.gender].join("-");
}

/** 질문 횟수를 세는 범위. 같은 범위의 질문은 같은 무료 횟수를 나눠 써요. */
export function scopeFor(kind: ChatKind, birth: BirthInput | null, partnerBirth: BirthInput | null, now: Date = new Date()): string {
  const day = kstDay(now);
  if (kind === "daily") return `d:${day}`;
  const h = createHash("sha256")
    .update(kind === "compat" ? `${birthKey(birth)}|${birthKey(partnerBirth)}` : birthKey(birth))
    .digest("hex")
    .slice(0, 16);
  return `${kind === "compat" ? "c" : "r"}:${day.slice(0, 7)}:${h}`;
}

/* DB 가 없거나 함수를 아직 안 만들었을 때를 위한 서버 메모리 대체(서버가 바뀌면 초기화돼요) */
const mem = new Map<string, { free: number; extra: number }>();
const memKey = (u: string, s: string) => `${u}|${s}`;

export const memQuota = {
  get(u: string, s: string, free: number): number {
    const r = mem.get(memKey(u, s));
    return r ? r.free + r.extra : free;
  },
  take(u: string, s: string, free: number): number {
    const k = memKey(u, s);
    const r = mem.get(k) ?? { free, extra: 0 };
    if (r.free >= 1) r.free -= 1;
    else if (r.extra >= 1) r.extra -= 1;
    else return -1;
    mem.set(k, r);
    if (mem.size > 5000) mem.delete(mem.keys().next().value as string);
    return r.free + r.extra;
  },
  refund(u: string, s: string): void {
    const r = mem.get(memKey(u, s));
    if (r) r.extra += 1;
  },
  reset(): void {
    mem.clear();
  },
};

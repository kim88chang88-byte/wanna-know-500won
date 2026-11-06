/*
 * 하단 메뉴의 빨간 점(새 항목 알림). 숫자 없이 점 하나만 보이고, 그 메뉴를 열면 꺼져요.
 * 이 기기에만 기억해요. (서버에 아무것도 보내지 않아요)
 *  - 운세 뽑기: 오늘 무료 뽑기·동전이 남아 있는데 아직 메뉴를 안 열었을 때
 *  - 도리상담실: 새로운 날이 되어 무료 질문이 채워졌는데 아직 상담실을 안 열었을 때
 *  - 보관함: 새 풀이가 저장됐는데 아직 보관함을 안 열었을 때
 */
import { dayKey, type StorageLike } from "./drawCounter";

export const NAV_EVENT = "wanna500:nav";
const K_DRAW_AVAIL = "wanna500:nav:draw-avail"; // 홈이 적어 둬요: {on, key}
const K_DRAW_SEEN = "wanna500:nav:draw-seen";
const K_CHAT_SEEN = "wanna500:nav:chat-seen"; // 마지막으로 상담실을 연 날짜
const K_VAULT_NEW = "wanna500:nav:vault-new"; // "1" = 새 풀이가 저장됨

export interface NavDots {
  draw: boolean;
  chat: boolean;
  vault: boolean;
}

function get(st: StorageLike | null, k: string): string | null {
  try {
    return st?.getItem(k) ?? null;
  } catch {
    return null;
  }
}
function set(st: StorageLike | null, k: string, v: string): void {
  try {
    st?.setItem(k, v);
  } catch {
    /* 저장이 막힌 환경이면 점만 안 기억해요 */
  }
}
function del(st: StorageLike | null, k: string): void {
  try {
    st?.removeItem?.(k);
  } catch {
    /* 무시 */
  }
}

/** 홈 화면이 "오늘 무료 뽑기·동전이 남았는지"를 적어 둬요. key 는 날짜+동전 수라서, 새 동전을 받으면 다시 켜져요. */
export function writeDrawAvail(st: StorageLike | null, on: boolean, coins: number, now: Date): void {
  set(st, K_DRAW_AVAIL, JSON.stringify({ on, key: `${dayKey(now)}:${coins}` }));
}

export function readNavDots(st: StorageLike | null, chatOn: boolean, now: Date): NavDots {
  let draw = false;
  try {
    const a = JSON.parse(get(st, K_DRAW_AVAIL) ?? "null") as { on?: unknown; key?: unknown } | null;
    draw = a?.on === true && typeof a.key === "string" && get(st, K_DRAW_SEEN) !== a.key;
  } catch {
    draw = false;
  }
  return {
    draw,
    chat: chatOn && get(st, K_CHAT_SEEN) !== dayKey(now),
    vault: get(st, K_VAULT_NEW) === "1",
  };
}

export function markNavSeen(st: StorageLike | null, which: keyof NavDots, now: Date): void {
  if (which === "draw") {
    try {
      const a = JSON.parse(get(st, K_DRAW_AVAIL) ?? "null") as { key?: unknown } | null;
      if (typeof a?.key === "string") set(st, K_DRAW_SEEN, a.key);
    } catch {
      /* 무시 */
    }
  } else if (which === "chat") set(st, K_CHAT_SEEN, dayKey(now));
  else del(st, K_VAULT_NEW);
}

/** 새 풀이가 보관함에 저장됐어요 → 보관함에 점 */
export function markVaultNew(st: StorageLike | null): void {
  set(st, K_VAULT_NEW, "1");
}

export function pingNav(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NAV_EVENT));
}

import { CHAT_SYNCED_KEY, dropExpired, limitRooms, parseRooms, type ChatRoom } from "@/lib/chatRooms";

/*
 * 상담실 대화방을 서버와 맞춰요. 이 기기의 저장본이 먼저이고, 로그인한 회원이면 서버에도 한 부 두어요.
 * 서버에는 마지막 대화 후 30일만 보관해요. 서버가 안 되거나 로그인 전이면 이 기기에서만 동작해요.
 */

type Store = { getItem(k: string): string | null; setItem(k: string, v: string): void };

export function readSynced(st: Store | null): number {
  try {
    const n = Number(st?.getItem(CHAT_SYNCED_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeSynced(st: Store | null, at: number): void {
  try {
    st?.setItem(CHAT_SYNCED_KEY, String(at));
  } catch {
    /* 무시 */
  }
}

/**
 * 이 기기의 방과 서버의 방을 합쳐요.
 * - 양쪽에 있는 방은 더 최근에 바뀐 쪽을 써요.
 * - 서버에만 있는 방(다른 기기에서 만든 방)은 가져와요.
 * - 이 기기에만 있는 방은, 마지막으로 맞춘 뒤에 바뀐 것만 남겨요. (다른 기기에서 지운 방이 되살아나지 않게)
 */
export function mergeRooms(local: ChatRoom[], server: ChatRoom[], lastSynced: number, now: Date = new Date()): ChatRoom[] {
  const byId = new Map<string, ChatRoom>();
  for (const s of server) byId.set(s.id, s);
  for (const l of local) {
    const s = byId.get(l.id);
    if (s) {
      if (l.updatedAt > s.updatedAt) byId.set(l.id, l);
    } else if (l.updatedAt > lastSynced) {
      byId.set(l.id, l);
    }
  }
  return limitRooms(dropExpired([...byId.values()], now), now);
}

/** 두 목록이 같은지 (방 번호와 바뀐 시각으로 가볍게 비교) */
export function sameRooms(a: ChatRoom[], b: ChatRoom[]): boolean {
  if (a.length !== b.length) return false;
  const m = new Map(b.map((r) => [r.id, r.updatedAt]));
  return a.every((r) => m.get(r.id) === r.updatedAt);
}

let off = false; // 로그인이 안 되어 있거나 서버가 막혀 있으면 이번 방문에서는 더 시도하지 않아요

/** 서버의 내 대화방. 로그인 전·서버 문제면 null */
export async function pullRooms(timeoutMs = 3000): Promise<ChatRoom[] | null> {
  if (off) return null;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/chat/rooms", { cache: "no-store", signal: ctl.signal });
    if (res.status === 401 || res.status === 503) {
      off = true;
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { rooms?: unknown } | null;
    return parseRooms(data?.rooms);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 내 대화방을 서버에 맞춰요. 성공하면 true */
export async function pushRooms(rooms: ChatRoom[], keepalive = false): Promise<boolean> {
  if (off) return false;
  try {
    const res = await fetch("/api/chat/rooms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooms: dropExpired(rooms) }),
      keepalive: keepalive && JSON.stringify(rooms).length < 60_000,
    });
    if (res.status === 401 || res.status === 503) off = true;
    return res.ok;
  } catch {
    return false;
  }
}

/** 로그인 상태가 바뀌었을 때(로그아웃 등) 다시 시도할 수 있게 되돌려요 */
export function resetSync(): void {
  off = false;
}

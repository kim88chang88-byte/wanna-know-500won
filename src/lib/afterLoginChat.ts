import type { ChatCtx } from "@/lib/chatContext";

/**
 * 비회원이 "로그인하고 도리에게 더 물어보기"를 눌러 로그인 창으로 갔을 때, 로그인하고 돌아오면
 * 곧바로 도리 상담실로 보내려고 "어떤 한마디를 보고 있었는지"만 잠깐 이 기기에 적어 둬요.
 * (이름·생일은 넣지 않아요.) 20분이 지나거나 로그인 창을 그냥 닫으면 지워요.
 */
export const AFTER_LOGIN_CHAT_KEY = "wanna500:after-login-chat:v1";
export const AFTER_LOGIN_CHAT_TTL_MS = 20 * 60 * 1000;

type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): void };

export function saveAfterLoginChat(store: Store | null, ctx: ChatCtx, now: number = Date.now()): void {
  try {
    store?.setItem(AFTER_LOGIN_CHAT_KEY, JSON.stringify({ kind: ctx.kind, summary: ctx.summary.slice(0, 600), at: now }));
  } catch {
    /* 저장이 안 돼도 로그인 뒤에 직접 다시 누르면 돼요 */
  }
}

export function clearAfterLoginChat(store: Store | null): void {
  try {
    if (!store) return;
    if (store.removeItem) store.removeItem(AFTER_LOGIN_CHAT_KEY);
    else store.setItem(AFTER_LOGIN_CHAT_KEY, "");
  } catch {
    /* 무시 */
  }
}

/** 적어 둔 것을 꺼내면서 지워요. 없거나 20분이 지났거나 깨졌으면 null. */
export function takeAfterLoginChat(store: Store | null, now: number = Date.now()): ChatCtx | null {
  try {
    const raw = store?.getItem(AFTER_LOGIN_CHAT_KEY);
    clearAfterLoginChat(store);
    if (!raw) return null;
    const v = JSON.parse(raw) as { kind?: unknown; summary?: unknown; at?: unknown };
    if (v.kind !== "daily" || typeof v.summary !== "string" || !v.summary || typeof v.at !== "number") return null;
    if (now - v.at > AFTER_LOGIN_CHAT_TTL_MS || now < v.at) return null;
    return { kind: "daily", summary: v.summary };
  } catch {
    return null;
  }
}

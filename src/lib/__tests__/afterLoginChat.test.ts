import { describe, expect, it } from "vitest";
import { AFTER_LOGIN_CHAT_TTL_MS, AFTER_LOGIN_GO_CHAT_KEY, clearAfterLoginChat, saveAfterLoginChat, saveAfterLoginGoChat, takeAfterLoginChat, takeAfterLoginGoChat } from "../afterLoginChat";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("로그인 뒤 상담실 이어가기", () => {
  it("저장한 한마디를 한 번만 꺼낼 수 있다", () => {
    const s = mem();
    saveAfterLoginChat(s, { kind: "daily", summary: "오늘의 한마디: 좋은 날" }, 1000);
    expect(takeAfterLoginChat(s, 2000)).toEqual({ kind: "daily", summary: "오늘의 한마디: 좋은 날" });
    expect(takeAfterLoginChat(s, 2000)).toBeNull();
  });
  it("20분이 지나면 버린다", () => {
    const s = mem();
    saveAfterLoginChat(s, { kind: "daily", summary: "x" }, 0);
    expect(takeAfterLoginChat(s, AFTER_LOGIN_CHAT_TTL_MS + 1)).toBeNull();
  });
  it("깨진 값은 null", () => {
    const s = mem();
    s.setItem("wanna500:after-login-chat:v1", "{oops");
    expect(takeAfterLoginChat(s)).toBeNull();
  });
});

describe("하단 메뉴 도리상담실로 로그인한 뒤 이동", () => {
  it("표시를 한 번만 꺼낼 수 있다", () => {
    const s = mem();
    saveAfterLoginGoChat(s, 1000);
    expect(takeAfterLoginGoChat(s, 2000)).toBe(true);
    expect(takeAfterLoginGoChat(s, 2000)).toBe(false);
  });
  it("20분이 지났거나 시계가 거꾸로 가면 버린다", () => {
    const s = mem();
    saveAfterLoginGoChat(s, 0);
    expect(takeAfterLoginGoChat(s, AFTER_LOGIN_CHAT_TTL_MS + 1)).toBe(false);
    saveAfterLoginGoChat(s, 5000);
    expect(takeAfterLoginGoChat(s, 1000)).toBe(false);
  });
  it("표시가 없거나 깨졌으면 false", () => {
    const s = mem();
    expect(takeAfterLoginGoChat(s)).toBe(false);
    s.setItem(AFTER_LOGIN_GO_CHAT_KEY, "{oops");
    expect(takeAfterLoginGoChat(s)).toBe(false);
    expect(takeAfterLoginGoChat(null)).toBe(false);
  });
  it("로그인 창을 닫으면(clear) 한마디 이어가기와 상담실 이동 표시가 모두 지워진다", () => {
    const s = mem();
    saveAfterLoginChat(s, { kind: "daily", summary: "x" }, 1000);
    saveAfterLoginGoChat(s, 1000);
    clearAfterLoginChat(s);
    expect(takeAfterLoginChat(s, 1500)).toBeNull();
    expect(takeAfterLoginGoChat(s, 1500)).toBe(false);
  });
  it("한마디 꺼내기는 상담실 이동 표시를 건드리지 않는다", () => {
    const s = mem();
    saveAfterLoginChat(s, { kind: "daily", summary: "x" }, 1000);
    saveAfterLoginGoChat(s, 1000);
    expect(takeAfterLoginChat(s, 1500)).not.toBeNull();
    expect(takeAfterLoginGoChat(s, 1500)).toBe(true);
  });
});

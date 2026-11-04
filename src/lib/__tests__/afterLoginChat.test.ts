import { describe, expect, it } from "vitest";
import { AFTER_LOGIN_CHAT_TTL_MS, saveAfterLoginChat, takeAfterLoginChat } from "../afterLoginChat";

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

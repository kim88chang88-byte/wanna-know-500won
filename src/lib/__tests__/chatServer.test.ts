import { describe, expect, it } from "vitest";
import { canChatWith, chatServerCap } from "../chatServer";

describe("상담실 열어 주기", () => {
  const admin = { ADMIN_USER_IDS: "kakao:1" };
  it("기본은 관리자만 쓸 수 있어요", () => {
    expect(canChatWith("kakao:1", admin)).toBe(true);
    expect(canChatWith("kakao:2", admin)).toBe(false);
    expect(canChatWith(null, admin)).toBe(false);
  });
  it("CHAT_ALLOW_IDS 에 적은 회원은 먼저 쓸 수 있어요", () => {
    const env = { ...admin, CHAT_ALLOW_IDS: "kakao:2, naver:3\ngoogle:4" };
    expect(canChatWith("kakao:2", env)).toBe(true);
    expect(canChatWith("naver:3", env)).toBe(true);
    expect(canChatWith("google:4", env)).toBe(true);
    expect(canChatWith("kakao:9", env)).toBe(false);
  });
  it("CHAT_OPEN=true 면 로그인한 모든 회원이 쓸 수 있고, 로그인 전에는 안 돼요", () => {
    expect(canChatWith("kakao:9", { CHAT_OPEN: "TRUE" })).toBe(true);
    expect(canChatWith(undefined, { CHAT_OPEN: "true" })).toBe(false);
  });
  it("서버 하루 상한은 기본 300, 숫자로 바꿀 수 있어요", () => {
    expect(chatServerCap({})).toBe(300);
    expect(chatServerCap({ CHAT_DAILY_CAP: "120" })).toBe(120);
    expect(chatServerCap({ CHAT_DAILY_CAP: "abc" })).toBe(300);
  });
});

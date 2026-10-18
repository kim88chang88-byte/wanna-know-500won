import { describe, it, expect } from "vitest";
import { parseUnlinkParams, verifyKakaoAdminAuth } from "../kakaoUnlink";

describe("카카오 연결 끊기 웹훅 도우미", () => {
  it("KakaoAK 어드민 키가 맞을 때만 통과해요", () => {
    expect(verifyKakaoAdminAuth("KakaoAK abc123", "abc123")).toBe(true);
    expect(verifyKakaoAdminAuth("kakaoak  abc123 ", " abc123 ")).toBe(true);
    expect(verifyKakaoAdminAuth("KakaoAK abc124", "abc123")).toBe(false);
    expect(verifyKakaoAdminAuth("KakaoAK abc", "abc123")).toBe(false);
    expect(verifyKakaoAdminAuth("Bearer abc123", "abc123")).toBe(false);
    expect(verifyKakaoAdminAuth("abc123", "abc123")).toBe(false);
    expect(verifyKakaoAdminAuth(null, "abc123")).toBe(false);
    expect(verifyKakaoAdminAuth("KakaoAK abc123", undefined)).toBe(false);
    expect(verifyKakaoAdminAuth("KakaoAK ", "")).toBe(false);
  });

  it("user_id 는 숫자만 받고, 사유는 정리해요", () => {
    expect(parseUnlinkParams(new URLSearchParams("app_id=1&user_id=5140333113&referrer_type=UNLINK_FROM_APPS"))).toEqual({ userId: "5140333113", referrerType: "UNLINK_FROM_APPS" });
    expect(parseUnlinkParams(new URLSearchParams("user_id=5140333113"))).toEqual({ userId: "5140333113", referrerType: "UNKNOWN" });
    expect(parseUnlinkParams(new URLSearchParams("user_id=5140333113&referrer_type=a<b>%0A"))).toEqual({ userId: "5140333113", referrerType: "UNKNOWN" });
    expect(parseUnlinkParams(new URLSearchParams("user_id=g_1140262"))).toBeNull(); // 구글 회원은 대상이 아니에요
    expect(parseUnlinkParams(new URLSearchParams("user_id=n_abc"))).toBeNull();
    expect(parseUnlinkParams(new URLSearchParams("user_id=12 OR 1=1"))).toBeNull();
    expect(parseUnlinkParams(new URLSearchParams("user_id=" + "9".repeat(21)))).toBeNull();
    expect(parseUnlinkParams(new URLSearchParams(""))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildOtpMail, checkOtpToken, createOtpToken, emailHash, emailLoginConfigured, emailUserId, generateCode, normalizeEmail } from "../emailLogin";

const SECRET = "s".repeat(40);

describe("normalizeEmail", () => {
  it("공백을 지우고 소문자로 바꿔요", () => {
    expect(normalizeEmail("  Me@Example.COM ")).toBe("me@example.com");
  });
  it("이메일 모양이 아니면 null", () => {
    for (const v of ["", "abc", "a@b", "a@b.c", "a b@c.com", "a@@c.com", "<a>@c.com", 123, null, undefined]) expect(normalizeEmail(v)).toBeNull();
    expect(normalizeEmail(`${"a".repeat(250)}@x.com`)).toBeNull();
  });
});

describe("회원 번호와 해시", () => {
  it("같은 이메일이면 같고, 다르면 달라요", () => {
    expect(emailUserId("a@b.com", SECRET)).toBe(emailUserId("a@b.com", SECRET));
    expect(emailUserId("a@b.com", SECRET)).not.toBe(emailUserId("c@b.com", SECRET));
    expect(emailUserId("a@b.com", SECRET)).not.toBe(emailUserId("a@b.com", "t".repeat(40)));
  });
  it("e_ 로 시작하고 DB 가 받는 문자만 써요(최대 64자)", () => {
    expect(emailUserId("a@b.com", SECRET)).toMatch(/^e_[0-9A-Za-z_-]{22}$/);
  });
  it("회원 번호에 이메일 원문이 들어가지 않아요", () => {
    expect(emailUserId("kim@naver.com", SECRET)).not.toContain("kim");
    expect(emailHash("kim@naver.com", SECRET)).not.toContain("kim");
  });
});

describe("인증번호 토큰", () => {
  it("6자리 숫자를 만들어요", () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it("맞는 이메일과 번호면 통과해요", () => {
    const t = createOtpToken("a@b.com", "123456", SECRET, 1000);
    expect(checkOtpToken(t, "a@b.com", "123456", SECRET, 1001).ok).toBe(true);
  });
  it("틀린 번호, 다른 이메일, 다른 비밀키는 막아요", () => {
    const t = createOtpToken("a@b.com", "123456", SECRET, 1000);
    expect(checkOtpToken(t, "a@b.com", "654321", SECRET, 1001)).toEqual({ ok: false, reason: "wrong" });
    expect(checkOtpToken(t, "x@b.com", "123456", SECRET, 1001)).toEqual({ ok: false, reason: "wrong" });
    expect(checkOtpToken(t, "a@b.com", "123456", "t".repeat(40), 1001)).toEqual({ ok: false, reason: "wrong" });
  });
  it("10분이 지나면 만료예요", () => {
    const t = createOtpToken("a@b.com", "123456", SECRET, 1000);
    expect(checkOtpToken(t, "a@b.com", "123456", SECRET, 1000 + 600 - 1).ok).toBe(true);
    expect(checkOtpToken(t, "a@b.com", "123456", SECRET, 1000 + 600)).toEqual({ ok: false, reason: "expired" });
  });
  it("쿠키 값을 고쳐도 통과하지 못해요", () => {
    const t = createOtpToken("a@b.com", "123456", SECRET, 1000);
    const forged = `${1000 + 99999}.${t.split(".")[1]}`;
    expect(checkOtpToken(forged, "a@b.com", "123456", SECRET, 1001).ok).toBe(false);
    expect(checkOtpToken("garbage", "a@b.com", "123456", SECRET, 1001).ok).toBe(false);
    expect(checkOtpToken(undefined, "a@b.com", "123456", SECRET, 1001).ok).toBe(false);
    expect(checkOtpToken(t, "a@b.com", "12345", SECRET, 1001).ok).toBe(false);
  });
  it("쿠키 값에 인증번호가 들어 있지 않아요", () => {
    expect(createOtpToken("a@b.com", "123456", SECRET, 1000)).not.toContain("123456");
  });
});

describe("설정과 메일", () => {
  it("키·보내는 주소·비밀키가 모두 있어야 켜져요", () => {
    expect(emailLoginConfigured({ RESEND_API_KEY: "k", EMAIL_FROM: "a <b@c.com>", AUTH_SECRET: SECRET })).toBe(true);
    expect(emailLoginConfigured({ RESEND_API_KEY: "k", AUTH_SECRET: SECRET })).toBe(false);
    expect(emailLoginConfigured({ EMAIL_FROM: "a", AUTH_SECRET: SECRET })).toBe(false);
    expect(emailLoginConfigured({ RESEND_API_KEY: "k", EMAIL_FROM: "a", AUTH_SECRET: "short" })).toBe(false);
  });
  it("메일 제목과 본문에 번호와 유효시간이 있어요", () => {
    const m = buildOtpMail("123456");
    expect(m.subject).toContain("123456");
    expect(m.text).toContain("10분");
    expect(m.html).toContain("123456");
  });
});

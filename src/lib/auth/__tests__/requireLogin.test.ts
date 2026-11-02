import { describe, expect, it } from "vitest";
import { checkLogin } from "../requireLogin";
import { createSessionToken, SESSION_COOKIE } from "../session";

const SECRET = "test-secret-test-secret-test-secret-1234";

describe("checkLogin", () => {
  it("유효한 로그인 쿠키가 있으면 통과해요", () => {
    const token = createSessionToken({ sub: "123", nick: "철수" } as never, SECRET);
    const r = checkLogin(`${SESSION_COOKIE}=${token}`, SECRET);
    expect(r.ok).toBe(true);
  });
  it("쿠키가 없거나 망가졌거나 비밀키가 다르면 막아요", () => {
    expect(checkLogin(null, SECRET).ok).toBe(false);
    expect(checkLogin("", SECRET).ok).toBe(false);
    expect(checkLogin(`${SESSION_COOKIE}=abc.def`, SECRET).ok).toBe(false);
    const token = createSessionToken({ sub: "123", nick: "철수" } as never, SECRET);
    expect(checkLogin(`${SESSION_COOKIE}=${token}`, "another-secret-another-secret-another-1")).toEqual({ ok: false });
  });
});

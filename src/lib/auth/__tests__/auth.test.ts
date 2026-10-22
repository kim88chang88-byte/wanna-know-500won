import { describe, it, expect } from "vitest";
import { buildAuthorizeUrl, fetchKakaoProfile, KakaoAuthError } from "../kakao";
import { loadAuthConfig } from "../config";
import { createSessionToken, readCookie, statesMatch, verifySessionToken } from "../session";

const SECRET = "x".repeat(40);
const now = 1_000_000;

describe("session token", () => {
  it("서명한 세션은 그대로 읽혀요", () => {
    const t = createSessionToken({ sub: "123", nick: "꽃", exp: now + 100 }, SECRET, now);
    expect(verifySessionToken(t, SECRET, now, 0)).toEqual({ sub: "123", nick: "꽃", exp: now + 100, iat: now });
  });
  it("만료·변조·다른 비밀키·짧은 비밀키는 거절해요", () => {
    const t = createSessionToken({ sub: "123", exp: now + 100 }, SECRET);
    expect(verifySessionToken(t, SECRET, now + 200)).toBe(null);
    const [p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "999", exp: now + 100 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${s}`, SECRET, now)).toBe(null);
    expect(verifySessionToken(`${p}.${s}x`, SECRET, now)).toBe(null);
    expect(verifySessionToken(t, "y".repeat(40), now)).toBe(null);
    expect(verifySessionToken(t, "short", now)).toBe(null);
    expect(verifySessionToken(undefined, SECRET, now)).toBe(null);
    expect(verifySessionToken("garbage", SECRET, now)).toBe(null);
  });
  it("쿠키·state 헬퍼", () => {
    expect(readCookie("a=1; b=hello%20x", "b")).toBe("hello x");
    expect(readCookie("a=1", "b")).toBe(undefined);
    expect(statesMatch("abc", "abc")).toBe(true);
    expect(statesMatch("abc", "abd")).toBe(false);
    expect(statesMatch("abc", undefined)).toBe(false);
  });
});

describe("config", () => {
  it("필수 값이 없으면 null, 있으면 기본 redirect 주소를 만들어요", () => {
    expect(loadAuthConfig({}, "http://localhost:3000/x")).toBe(null);
    expect(loadAuthConfig({ KAKAO_CLIENT_ID: "id", AUTH_SECRET: "short" }, "http://localhost:3000/x")).toBe(null);
    const c = loadAuthConfig({ KAKAO_CLIENT_ID: "id", AUTH_SECRET: SECRET }, "http://localhost:3000/x");
    expect(c?.kakao.redirectUri).toBe("http://localhost:3000/api/auth/kakao/callback");
    const d = loadAuthConfig(
      { KAKAO_CLIENT_ID: "id", AUTH_SECRET: SECRET, KAKAO_REDIRECT_URI: "https://a.kr/cb" },
      "http://internal/x",
    );
    expect(d?.kakao.redirectUri).toBe("https://a.kr/cb");
  });
});

describe("kakao", () => {
  const cfg = { clientId: "ID", clientSecret: "SEC", redirectUri: "http://localhost:3000/cb" };
  it("authorize URL", () => {
    const u = new URL(buildAuthorizeUrl(cfg, "st"));
    expect(u.origin + u.pathname).toBe("https://kauth.kakao.com/oauth/authorize");
    expect(u.searchParams.get("client_id")).toBe("ID");
    expect(u.searchParams.get("redirect_uri")).toBe(cfg.redirectUri);
    expect(u.searchParams.get("response_type")).toBe("code");
    expect(u.searchParams.get("state")).toBe("st");
    expect(u.searchParams.get("scope")).toBe("profile_nickname");
  });
  it("코드를 프로필로 바꿔요", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const f = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("/oauth/token")) return new Response(JSON.stringify({ access_token: "AT" }), { status: 200 });
      return new Response(JSON.stringify({ id: 4242, kakao_account: { profile: { nickname: " 별 " } } }), { status: 200 });
    };
    const p = await fetchKakaoProfile(cfg, "CODE", f);
    expect(p).toEqual({ id: "4242", nickname: "별" });
    const body = new URLSearchParams(String(calls[0].init?.body));
    expect(body.get("code")).toBe("CODE");
    expect(body.get("client_secret")).toBe("SEC");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe("Bearer AT");
  });
  it("실패 메시지에는 상태 코드만 담겨요", async () => {
    const f = async () => new Response('{"secret":"leak"}', { status: 401 });
    let msg = "";
    try {
      await fetchKakaoProfile(cfg, "C", f);
    } catch (e) {
      expect(e instanceof KakaoAuthError).toBe(true);
      msg = (e as Error).message;
    }
    expect(msg).toBe("token HTTP 401");
  });
  it("예전 방식(properties) 닉네임도 읽어요", async () => {
    const f = async (url: string) =>
      url.includes("token")
        ? new Response(JSON.stringify({ access_token: "AT" }), { status: 200 })
        : new Response(JSON.stringify({ id: 8, properties: { nickname: "달" } }), { status: 200 });
    expect(await fetchKakaoProfile(cfg, "C", f)).toEqual({ id: "8", nickname: "달" });
  });
  it("닉네임이 없어도 괜찮아요", async () => {
    const f = async (url: string) =>
      url.includes("token")
        ? new Response(JSON.stringify({ access_token: "AT" }), { status: 200 })
        : new Response(JSON.stringify({ id: 7 }), { status: 200 });
    expect(await fetchKakaoProfile(cfg, "C", f)).toEqual({ id: "7", nickname: undefined });
  });
});

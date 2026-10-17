import { describe, expect, it } from "vitest";
import { buildNaverAuthorizeUrl, fetchNaverProfile, NaverAuthError } from "../naver";
import { loadNaverAuthConfig } from "../config";

const cfg = { clientId: "cid", clientSecret: "sec", redirectUri: "https://x.test/api/auth/naver/callback" };

function fakeFetch(me: unknown, token: unknown = { access_token: "tok" }, meOk = true) {
  return async (url: string) => {
    if (url.includes("oauth2.0/token")) return new Response(JSON.stringify(token), { status: 200 });
    return new Response(JSON.stringify(me), { status: meOk ? 200 : 401 });
  };
}

async function errorOf(f: ReturnType<typeof fakeFetch>) {
  try {
    await fetchNaverProfile(cfg, "c", "s", f);
    return "no error";
  } catch (e) {
    return e instanceof NaverAuthError ? e.message : "wrong error type";
  }
}

describe("naver login", () => {
  it("authorize URL has state and client id", () => {
    const u = new URL(buildNaverAuthorizeUrl(cfg, "st"));
    expect(u.searchParams.get("state")).toBe("st");
    expect(u.searchParams.get("client_id")).toBe("cid");
    expect(u.searchParams.get("response_type")).toBe("code");
  });
  it("prefixes the id and trims the nickname", async () => {
    const p = await fetchNaverProfile(
      cfg, "c", "s",
      fakeFetch({ resultcode: "00", response: { id: "abc-123_x", nickname: " 꽃 " } }),
    );
    expect(p.id).toBe("n_abc-123_x");
    expect(p.nickname).toBe("꽃");
  });
  it("works without a nickname", async () => {
    const p = await fetchNaverProfile(cfg, "c", "s", fakeFetch({ resultcode: "00", response: { id: "a1" } }));
    expect(p.nickname).toBe(undefined);
  });
  it("rejects bad responses", async () => {
    expect(await errorOf(fakeFetch({}, {}))).toBe("token missing");
    expect(await errorOf(fakeFetch({ resultcode: "024" }))).toBe("me missing id");
    expect(await errorOf(fakeFetch({ resultcode: "00", response: { id: "a/b" } }))).toBe("me missing id");
    expect(await errorOf(fakeFetch({}, undefined, false))).toBe("me HTTP 401");
  });
  it("config needs id, secret and AUTH_SECRET", () => {
    const url = "https://x.test/a";
    const env = { NAVER_CLIENT_ID: "a", AUTH_SECRET: "x".repeat(32) };
    expect(loadNaverAuthConfig(env, url)).toBe(null);
    expect(loadNaverAuthConfig({ ...env, NAVER_CLIENT_SECRET: "b" }, url)?.naver.redirectUri).toBe(
      "https://x.test/api/auth/naver/callback",
    );
  });
});

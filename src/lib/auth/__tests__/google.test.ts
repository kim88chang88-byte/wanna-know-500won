import { describe, expect, it } from "vitest";
import { buildGoogleAuthorizeUrl, fetchGoogleProfile, GoogleAuthError } from "../google";
import { loadGoogleAuthConfig } from "../config";

const cfg = { clientId: "cid", clientSecret: "sec", redirectUri: "https://x.test/api/auth/google/callback" };
const SECRET = "x".repeat(32);

function fakeFetch(me: unknown, tokenOk = true, meOk = true) {
  return async (url: string) => {
    if (url.includes("oauth2.googleapis.com")) {
      return new Response(JSON.stringify({ access_token: "tok" }), { status: tokenOk ? 200 : 400 });
    }
    return new Response(JSON.stringify(me), { status: meOk ? 200 : 401 });
  };
}

describe("google login", () => {
  it("authorize URL asks only openid profile", () => {
    const u = new URL(buildGoogleAuthorizeUrl(cfg, "st"));
    expect(u.searchParams.get("scope")).toBe("openid profile");
    expect(u.searchParams.get("state")).toBe("st");
    expect(u.searchParams.get("client_id")).toBe("cid");
  });
  it("prefixes the id and trims the name", async () => {
    const p = await fetchGoogleProfile(cfg, "code", fakeFetch({ sub: "123", name: "  김꽃  " }));
    expect(p.id).toBe("g_123");
    expect(p.nickname).toBe("김꽃");
  });
  it("rejects bad sub and failing HTTP", async () => {
    const msg = async (f: ReturnType<typeof fakeFetch>) => {
      try {
        await fetchGoogleProfile(cfg, "c", f);
        return "no error";
      } catch (e) {
        return e instanceof GoogleAuthError ? e.message : "wrong error type";
      }
    };
    expect(await msg(fakeFetch({ sub: "a/b" }))).toBe("me missing sub");
    expect(await msg(fakeFetch({}, false))).toBe("token HTTP 400");
    expect(await msg(fakeFetch({}, true, false))).toBe("me HTTP 401");
  });
  it("config needs id, secret and AUTH_SECRET", () => {
    const url = "https://x.test/a";
    expect(loadGoogleAuthConfig({ GOOGLE_CLIENT_ID: "a", AUTH_SECRET: SECRET }, url)).toBe(null);
    const c = loadGoogleAuthConfig({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b", AUTH_SECRET: SECRET }, url);
    expect(c?.google.redirectUri).toBe("https://x.test/api/auth/google/callback");
  });
});

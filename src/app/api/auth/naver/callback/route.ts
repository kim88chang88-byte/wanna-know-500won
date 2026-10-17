import { NextResponse } from "next/server";
import { loadNaverAuthConfig } from "@/lib/auth/config";
import { fetchNaverProfile } from "@/lib/auth/naver";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import {
  createSessionToken,
  readCookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  STATE_COOKIE,
  statesMatch,
} from "@/lib/auth/session";

export const runtime = "nodejs";

/** 네이버에서 돌아오는 곳: state 를 확인하고, 고유번호·이름만 꺼내 세션 쿠키를 만들어요. */
export async function GET(request: Request) {
  const config = loadNaverAuthConfig(process.env, request.url);
  if (!config) return NextResponse.redirect(new URL("/?login=unavailable", request.url));

  const base = new URL(config.naver.redirectUri).origin;
  const back = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/?login=${reason}`, base));
    res.cookies.set(STATE_COOKIE, "", { path: "/api/auth/naver", maxAge: 0 });
    return res;
  };

  const params = new URL(request.url).searchParams;
  // 사용자가 동의 화면에서 취소한 경우 등
  if (params.get("error")) return back("cancelled");

  const code = params.get("code");
  const expectedState = readCookie(request.headers.get("cookie"), STATE_COOKIE);
  if (!code || !statesMatch(params.get("state"), expectedState)) return back("error");

  try {
    const profile = await fetchNaverProfile(config.naver, code, params.get("state") ?? "");
    // DB 가 연결되어 있으면 회원을 저장·갱신해요. 실패해도 로그인은 계속돼요.
    const dbConfig = loadDbConfig(process.env);
    if (dbConfig) {
      try {
        await createDb(dbConfig).upsertUser(profile.id, profile.nickname);
      } catch (err) {
        console.error("upsertUser failed:", err instanceof Error ? err.message : "unknown");
      }
    }
    const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
    const token = createSessionToken({ sub: profile.id, nick: profile.nickname, exp }, config.secret);
    const res = NextResponse.redirect(new URL("/?login=success", base));
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
    });
    res.cookies.set(STATE_COOKIE, "", { path: "/api/auth/naver", maxAge: 0 });
    return res;
  } catch {
    return back("error");
  }
}

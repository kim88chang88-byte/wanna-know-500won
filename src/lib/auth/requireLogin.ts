import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken, type Session } from "./session";

/** 로그인한 요청인지 확인해요. 로그인하지 않았으면 돌려줄 401 응답을 줘요. (운세 뽑기·AI 풀이는 로그인한 회원만 쓸 수 있어요) */
export function checkLogin(cookieHeader: string | null | undefined, secret: string | undefined): { ok: true; session: Session } | { ok: false } {
  const session = verifySessionToken(readCookie(cookieHeader, SESSION_COOKIE), secret);
  return session ? { ok: true, session } : { ok: false };
}

export function requireLogin(request: Request): NextResponse | null {
  const r = checkLogin(request.headers.get("cookie"), process.env.AUTH_SECRET);
  if (r.ok) return null;
  return NextResponse.json({ error: "로그인하고 이용해 주세요.", code: "login_required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

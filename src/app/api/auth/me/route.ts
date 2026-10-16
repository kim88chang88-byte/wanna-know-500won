import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 지금 로그인 상태인지 알려줘요. 회원번호는 브라우저에 내려주지 않고 닉네임만 줘요. */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  return NextResponse.json(
    { loggedIn: Boolean(session), nickname: session?.nick ?? null, configured: Boolean(process.env.KAKAO_CLIENT_ID && process.env.AUTH_SECRET) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig, type DrawCounts } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** 지금 로그인 상태인지 알려줘요. 회원번호는 브라우저에 내려주지 않고 닉네임과 뽑기 횟수만 줘요. */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);

  let counts: DrawCounts | null = null;
  // 진단용 상태: off(환경변수 없음) / skipped(로그아웃 상태) / ok / error(요청 실패)
  let dbStatus: "off" | "skipped" | "ok" | "error" = "off";
  let dbError: string | null = null;
  const dbConfig = loadDbConfig(process.env);
  if (dbConfig) {
    dbStatus = "skipped";
    if (session) {
      const db = createDb(dbConfig);
      try {
        // 로그인 쿠키만 있고 회원 행이 없는 경우(DB 연결 전에 로그인한 사람)를 바로잡아요.
        [counts] = await Promise.all([db.getCounts(session.sub), db.ensureUser(session.sub, session.nick)]);
        dbStatus = "ok";
      } catch (err) {
        dbStatus = "error";
        dbError = err instanceof Error ? err.message : "unknown";
        console.error("me db failed:", dbError);
      }
    }
  }

  return NextResponse.json(
    {
      loggedIn: Boolean(session),
      nickname: session?.nick ?? null,
      counts,
      db: dbStatus,
      dbError,
      configured: Boolean(process.env.KAKAO_CLIENT_ID && process.env.AUTH_SECRET),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

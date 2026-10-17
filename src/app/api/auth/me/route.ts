import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig, type DrawCounts } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** 지금 로그인 상태인지 알려줘요. 회원번호는 브라우저에 내려주지 않고 닉네임과 뽑기 횟수만 줘요. */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);

  let counts: DrawCounts | null = null;
  const dbConfig = loadDbConfig(process.env);
  if (session && dbConfig) {
    try {
      counts = await createDb(dbConfig).getCounts(session.sub);
    } catch (err) {
      console.error("getCounts failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  return NextResponse.json(
    {
      loggedIn: Boolean(session),
      nickname: session?.nick ?? null,
      counts,
      configured: Boolean(process.env.KAKAO_CLIENT_ID && process.env.AUTH_SECRET),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** 회원 탈퇴: 저장된 회원 정보와 뽑기 기록을 지우고 로그인 쿠키를 없애요. (본인 세션이 있을 때만) */
export async function POST(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const dbConfig = loadDbConfig(process.env);
  if (dbConfig) {
    try {
      await createDb(dbConfig).deleteUser(session.sub);
    } catch (err) {
      // 지우지 못했다면 쿠키도 그대로 둬서, 다시 시도할 수 있게 해요.
      console.error("deleteUser failed:", err instanceof Error ? err.message : "unknown");
      return NextResponse.json({ error: "탈퇴 처리에 실패했어요. 잠시 뒤에 다시 시도해줘요." }, { status: 502 });
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

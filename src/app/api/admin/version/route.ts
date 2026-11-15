import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { deployInfo } from "@/lib/version";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/** 관리자 전용: 지금 돌아가는 배포가 어느 커밋인지 */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  return NextResponse.json(deployInfo(process.env, process.env.NEXT_PUBLIC_BUILT_AT ?? null), { headers: NO_STORE });
}

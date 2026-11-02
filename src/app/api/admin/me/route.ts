import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 지금 로그인한 사람이 관리자인지만 알려 줘요. (관리자용 버튼을 보일지 정하는 데 써요. 고유번호는 돌려주지 않아요) */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  return NextResponse.json({ admin: !!session && isAdmin(session.sub, process.env) }, { headers: { "Cache-Control": "no-store" } });
}

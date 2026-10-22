import { NextResponse } from "next/server";
import { guardOrigin } from "@/lib/guard";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 이 서비스에서만 로그아웃해요. (카카오 계정 자체는 로그아웃되지 않아요) */
export async function POST(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

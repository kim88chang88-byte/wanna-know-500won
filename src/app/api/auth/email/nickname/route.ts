import { NextResponse } from "next/server";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { checkNickname } from "@/lib/auth/nickname";
import { createSessionToken, readCookie, SESSION_COOKIE, SESSION_MAX_AGE_SEC, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** 이메일 로그인 직후 닉네임 정하기: 이메일로 로그인한 회원(e_…)만, 닉네임이 비어 있을 때 한 번 정해요. */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "email-nick", windowMs: 60000, ip: 10, user: 10 }, "잠시 뒤에 다시 시도해 줘."));
  if (denied) return denied;
  const secret = process.env.AUTH_SECRET;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), secret);
  if (!secret || !session || !session.sub.startsWith("e_")) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });

  let body: { nickname?: unknown } | null = null;
  try {
    body = (await request.json()) as { nickname?: unknown };
  } catch {
    body = null;
  }
  const check = checkNickname(body?.nickname);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const dbConfig = loadDbConfig(process.env);
  if (dbConfig) {
    try {
      await createDb(dbConfig).setNickname(session.sub, check.nick);
    } catch (err) {
      console.error("setNickname failed:", err instanceof Error ? err.message : "unknown");
      return NextResponse.json({ error: "저장하지 못했어. 잠시 뒤에 다시 시도해 줘." }, { status: 500 });
    }
  }
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const res = NextResponse.json({ ok: true, nickname: check.nick });
  res.cookies.set(SESSION_COOKIE, createSessionToken({ sub: session.sub, nick: check.nick, exp }, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  return res;
}

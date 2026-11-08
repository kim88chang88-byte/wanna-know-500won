import { NextResponse } from "next/server";
import { clientKey, guardOrigin, takeLimit } from "@/lib/guard";
import { checkOtpToken, EMAIL_OTP_COOKIE, EMAIL_OTP_TTL_SEC, emailHash, emailLoginConfigured, emailUserId, normalizeEmail } from "@/lib/auth/emailLogin";
import { createSessionToken, readCookie, SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";

const WINDOW = EMAIL_OTP_TTL_SEC * 1000;

/** 이메일 로그인 2단계: 인증번호가 맞으면 로그인 쿠키를 만들어요. (번호는 한 번만 쓸 수 있어요) */
export async function POST(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const secret = process.env.AUTH_SECRET;
  if (!emailLoginConfigured(process.env) || !secret) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { email?: unknown; code?: unknown } | null = null;
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown };
  } catch {
    body = null;
  }
  const email = normalizeEmail(body?.email);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "인증번호 6자리를 확인해 주세요." }, { status: 400 });

  // 번호를 무작정 대입하지 못하게: 같은 주소 10분에 6번, 같은 접속지 10분에 20번까지만 확인해요.
  const eh = emailHash(email, secret);
  const limits = await Promise.all([
    takeLimit("email-verify", `e:${eh}`, 6, WINDOW),
    takeLimit("email-verify-ip", `ip:${clientKey(request)}`, 20, WINDOW),
  ]);
  const blocked = limits.find((l) => !l.ok);
  if (blocked && !blocked.ok) {
    return NextResponse.json(
      { error: "인증번호를 너무 많이 틀렸어요. 새 인증번호를 받아 주세요.", code: "too_many", retryAfterSec: blocked.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfterSec) } },
    );
  }

  const check = checkOtpToken(readCookie(request.headers.get("cookie"), EMAIL_OTP_COOKIE), email, code, secret);
  if (!check.ok) {
    return NextResponse.json(
      check.reason === "expired"
        ? { error: "인증번호 시간이 지났어요. 새 인증번호를 받아 주세요.", code: "expired" }
        : { error: "인증번호가 맞지 않아요.", code: "wrong" },
      { status: 400 },
    );
  }
  // 한 번 쓴 번호는 다시 못 써요.
  const used = await takeLimit("email-used", check.sig, 1, WINDOW);
  if (!used.ok) return NextResponse.json({ error: "이미 쓴 인증번호예요. 새 인증번호를 받아 주세요.", code: "expired" }, { status: 400 });

  const sub = emailUserId(email, secret);
  const dbConfig = loadDbConfig(process.env);
  if (dbConfig) {
    try {
      await createDb(dbConfig).upsertUser(sub, undefined);
    } catch (err) {
      console.error("upsertUser failed:", err instanceof Error ? err.message : "unknown");
    }
  }
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSessionToken({ sub, exp }, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  res.cookies.set(EMAIL_OTP_COOKIE, "", { path: "/api/auth/email", maxAge: 0 });
  return res;
}

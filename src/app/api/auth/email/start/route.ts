import { NextResponse } from "next/server";
import { clientKey, guardOrigin, takeLimitStrict } from "@/lib/guard";
import {
  createOtpToken,
  EMAIL_OTP_COOKIE,
  EMAIL_OTP_TTL_SEC,
  EMAIL_RESEND_SEC,
  emailDailyCap,
  emailHash,
  emailLoginConfigured,
  generateCode,
  normalizeEmail,
  sendOtpMail,
} from "@/lib/auth/emailLogin";

export const runtime = "nodejs";

const HOUR = 60 * 60 * 1000;

/** 이메일 로그인 1단계: 인증번호를 메일로 보내고, 번호 확인용 서명을 쿠키에 심어요. */
export async function POST(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const secret = process.env.AUTH_SECRET;
  if (!emailLoginConfigured(process.env) || !secret) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { email?: unknown } | null = null;
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    body = null;
  }
  const email = normalizeEmail(body?.email);
  if (!email) return NextResponse.json({ error: "이메일 주소를 다시 확인해 주세요." }, { status: 400 });

  const eh = emailHash(email, secret);
  // 같은 주소 60초에 1번, 같은 주소·같은 접속지 1시간 한도, 서버 전체 하루 한도 (남용과 메일 요금 보호)
  const checks = await Promise.all([
    takeLimitStrict("email-send-min", `e:${eh}`, 1, EMAIL_RESEND_SEC * 1000),
    takeLimitStrict("email-send-hour", `e:${eh}`, 5, HOUR),
    takeLimitStrict("email-send-ip", `ip:${clientKey(request)}`, 10, HOUR),
    takeLimitStrict("email-send-all", "server", emailDailyCap(process.env), 24 * HOUR),
  ]);
  const blocked = checks.find((c) => !c.ok);
  if (blocked && !blocked.ok) {
    return NextResponse.json(
      { error: "인증번호를 너무 자주 요청했어요. 잠시 뒤에 다시 시도해 주세요.", retryAfterSec: blocked.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfterSec) } },
    );
  }

  const code = generateCode();
  const sent = await sendOtpMail(process.env, email, code);
  if (!sent) return NextResponse.json({ error: "메일을 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502 });

  const res = NextResponse.json({ ok: true, resendAfterSec: EMAIL_RESEND_SEC });
  res.cookies.set(EMAIL_OTP_COOKIE, createOtpToken(email, code, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/email",
    maxAge: EMAIL_OTP_TTL_SEC,
  });
  return res;
}

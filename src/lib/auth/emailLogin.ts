import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/*
 * 이메일 인증번호 로그인. 비밀번호도 이메일 원문도 저장하지 않아요.
 *  - 인증번호는 서버가 만들어 메일로만 보내요. 서버에는 "이메일+번호+만료시각"으로 만든 서명(mac)만 쿠키에 담아요.
 *  - 회원 번호는 이메일을 서버 비밀키로 해시한 값이라(e_...), 이메일 원문은 어디에도 남지 않아요.
 */

export const EMAIL_OTP_COOKIE = "wanna500_email_otp";
export const EMAIL_OTP_TTL_SEC = 60 * 10; // 인증번호는 10분 동안만 써요
export const EMAIL_RESEND_SEC = 60; // 같은 주소로는 60초에 한 번만 보내요
export const EMAIL_MAX_LEN = 254;

const EMAIL_RE = /^[^\s@<>()[\],;:"\\]+@[^\s@<>()[\],;:"\\]+\.[^\s@<>()[\],;:"\\]{2,}$/;

/** 공백을 지우고 소문자로 바꿔요. 이메일 모양이 아니면 null. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v.length < 6 || v.length > EMAIL_MAX_LEN || !EMAIL_RE.test(v)) return null;
  return v;
}

function mac(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** 이메일을 해시한 값. 속도 제한 키로 써요. (원문은 남기지 않아요) */
export function emailHash(email: string, secret: string): string {
  return mac(secret, `email-hash|${email}`).slice(0, 22);
}

/** 이메일 로그인 회원 번호: e_ + 해시. 카카오(숫자)·구글(g_)·네이버(n_)와 겹치지 않아요. */
export function emailUserId(email: string, secret: string): string {
  return `e_${mac(secret, `email-user|${email}`).slice(0, 22)}`;
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** 쿠키에 담는 값: `만료시각.서명`. 번호는 담지 않아요. */
export function createOtpToken(email: string, code: string, secret: string, nowSec: number = Math.floor(Date.now() / 1000)): string {
  const exp = nowSec + EMAIL_OTP_TTL_SEC;
  return `${exp}.${mac(secret, `otp|${email}|${code}|${exp}`)}`;
}

export type OtpCheck = { ok: true; sig: string } | { ok: false; reason: "expired" | "wrong" };

/** 쿠키 값과 사용자가 적은 이메일·번호가 맞는지 확인해요. */
export function checkOtpToken(token: string | undefined | null, email: string, code: string, secret: string, nowSec: number = Math.floor(Date.now() / 1000)): OtpCheck {
  if (!token || !/^\d{6}$/.test(code)) return { ok: false, reason: "wrong" };
  const dot = token.indexOf(".");
  if (dot < 1) return { ok: false, reason: "wrong" };
  const exp = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isInteger(exp)) return { ok: false, reason: "wrong" };
  if (exp <= nowSec) return { ok: false, reason: "expired" };
  const expected = mac(secret, `otp|${email}|${code}|${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "wrong" };
  return { ok: true, sig: expected };
}

/** 메일을 보낼 준비(발송 서비스 키·보내는 주소)가 됐는지. 안 됐으면 화면에서 버튼을 숨겨요. */
export function emailLoginConfigured(env: Record<string, string | undefined>): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim() && env.AUTH_SECRET && env.AUTH_SECRET.length >= 32);
}

/** 서버 전체가 하루에 보낼 수 있는 인증 메일 수(남용·요금 보호). EMAIL_DAILY_CAP 로 바꾸고, 비우면 300. */
export function emailDailyCap(env: Record<string, string | undefined>): number {
  const n = Number(env.EMAIL_DAILY_CAP);
  return Number.isInteger(n) && n > 0 ? n : 300;
}

export function buildOtpMail(code: string): { subject: string; text: string; html: string } {
  const minutes = EMAIL_OTP_TTL_SEC / 60;
  const subject = `[도유사주] 로그인 인증번호 ${code}`;
  const text = `도유사주 로그인 인증번호는 ${code} 입니다.\n${minutes}분 동안만 쓸 수 있어요.\n\n본인이 요청하지 않았다면 이 메일은 무시해 주세요.`;
  const html = `<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#222">
<p style="font-size:15px;margin:0 0 12px">도유사주 로그인 인증번호예요.</p>
<p style="font-size:34px;font-weight:800;letter-spacing:8px;margin:0 0 12px;color:#5b3fc4">${code}</p>
<p style="font-size:13px;color:#666;margin:0 0 4px">${minutes}분 동안만 쓸 수 있어요.</p>
<p style="font-size:12px;color:#999;margin:16px 0 0">본인이 요청하지 않았다면 이 메일은 무시해 주세요.</p></div>`;
  return { subject, text, html };
}

/** Resend 로 인증 메일을 보내요. 성공하면 true. (키는 서버에서만 써요) */
export async function sendOtpMail(env: Record<string, string | undefined>, to: string, code: string): Promise<boolean> {
  const key = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  if (!key || !from) return false;
  const mail = buildOtpMail(code);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: mail.subject, text: mail.text, html: mail.html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("email send failed:", res.status);
    return res.ok;
  } catch (err) {
    console.error("email send error:", err instanceof Error ? err.name : "unknown");
    return false;
  }
}

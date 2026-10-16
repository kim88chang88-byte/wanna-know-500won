import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** 로그인 세션 쿠키 이름. */
export const SESSION_COOKIE = "wanna500_session";
/** OAuth state(CSRF 방지) 쿠키 이름. */
export const STATE_COOKIE = "wanna500_oauth_state";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30일
export const STATE_MAX_AGE_SEC = 60 * 10; // 10분

export interface Session {
  /** 카카오 회원번호 (문자열) */
  sub: string;
  /** 카카오 닉네임 (동의하지 않았으면 없음) */
  nick?: string;
  /** 만료 시각 (초 단위 epoch) */
  exp: number;
}

const MIN_SECRET_LENGTH = 32;

export function isSecretValid(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** 세션을 `payload.서명` 형태의 문자열로 만들어요. 서버만 아는 비밀키로 서명해서 위조할 수 없어요. */
export function createSessionToken(session: Session, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** 서명과 만료를 확인해 세션을 돌려줘요. 하나라도 어긋나면 null. */
export function verifySessionToken(
  token: string | undefined | null,
  secret: string | undefined,
  nowSec: number = Math.floor(Date.now() / 1000),
): Session | null {
  if (!token || !isSecretValid(secret)) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
    if (typeof data.sub !== "string" || !data.sub) return null;
    if (typeof data.exp !== "number" || data.exp <= nowSec) return null;
    return { sub: data.sub, nick: typeof data.nick === "string" ? data.nick : undefined, exp: data.exp };
  } catch {
    return null;
  }
}

export function newState(): string {
  return randomBytes(24).toString("base64url");
}

export function statesMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** "a=1; b=2" 형태의 Cookie 헤더에서 값을 꺼내요. */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

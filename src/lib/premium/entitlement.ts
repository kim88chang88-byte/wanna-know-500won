import { createHmac, timingSafeEqual } from "node:crypto";
import { isSecretValid } from "@/lib/auth/session";

/*
 * 프리미엄 전체 풀이 이용권. 결제가 확인된 뒤에 서버가 서명해서 쿠키로 내려주고,
 * /api/premium 은 PREMIUM_LOCK 이 켜져 있을 때 이 이용권이 있는 요청에만 잠금 없는 전체 풀이를 줘요.
 * 요청 본문의 level 같은 값은 믿지 않아요. (결제 연결 때 결제 확인 웹훅에서 issueEntitlement 를 부르면 돼요)
 */
export const ENTITLEMENT_COOKIE = "wanna500_ent";

export interface Entitlement {
  /** 회원번호. 로그인 없이 결제한 경우 "*" */
  sub: string;
  /** 결제 주문 번호 (환불·추적용) */
  ref: string;
  /** 만료 (초 단위 epoch) */
  exp: number;
}

function key(secret: string): string {
  return `${secret}|entitlement`; // 로그인 쿠키와 서명 키를 분리해서, 로그인 쿠키로 이용권을 만들 수 없게 해요
}
function sign(payload: string, secret: string): string {
  return createHmac("sha256", key(secret)).update(payload).digest("base64url");
}

export function issueEntitlement(e: Entitlement, secret: string): string {
  const payload = Buffer.from(JSON.stringify(e), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** 서명·만료·주인(로그인한 회원과 같은지)을 확인해요. 모두 맞을 때만 true. */
export function hasEntitlement(
  token: string | undefined | null,
  secret: string | undefined,
  sessionSub: string | null,
  nowSec: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!token || !isSecretValid(secret)) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(sign(parts[0], secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const e = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as Partial<Entitlement>;
    if (typeof e.sub !== "string" || typeof e.exp !== "number" || e.exp <= nowSec) return false;
    return e.sub === "*" || e.sub === sessionSub;
  } catch {
    return false;
  }
}

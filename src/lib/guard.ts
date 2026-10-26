import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { createRateLimiter, type RateLimiter } from "@/lib/rateLimit";

/** 요청한 쪽의 주소(IP). */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

// ── Origin 검사 ────────────────────────────────────────────────
/**
 * 브라우저가 다른 사이트에서 보낸 쓰기 요청(POST/DELETE)을 거절해요. (로그인 쿠키는 SameSite=Lax 이지만 한 겹 더)
 * Origin 이 없는 요청(서버끼리 호출, 일부 도구)은 통과시켜요. 브라우저의 fetch/폼은 항상 Origin 이나 Sec-Fetch-Site 를 보내요.
 */
export function originAllowed(headers: Headers, requestUrl: string, env: Record<string, string | undefined> = process.env): boolean {
  if (headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = headers.get("origin");
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false; // "null" 등
  }
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(requestUrl).host);
  } catch {}
  for (const h of [headers.get("host"), headers.get("x-forwarded-host")]) if (h) allowed.add(h);
  if (env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowed.add(new URL(env.NEXT_PUBLIC_SITE_URL).host);
    } catch {}
  }
  return allowed.has(host);
}

/** 거절해야 하면 403 응답을, 괜찮으면 null 을 돌려줘요. */
export function guardOrigin(request: Request): NextResponse | null {
  if (originAllowed(request.headers, request.url)) return null;
  return NextResponse.json({ error: "허용되지 않은 요청이에요." }, { status: 403 });
}

// ── 속도 제한 (공용 저장소 + 메모리 보조) ─────────────────────────
type Limit = { ok: true } | { ok: false; retryAfterSec: number };

const memory = new Map<string, RateLimiter>();
function memoryLimiter(name: string, limit: number, windowMs: number): RateLimiter {
  const id = `${name}:${limit}:${windowMs}`;
  let l = memory.get(id);
  if (!l) {
    l = createRateLimiter(limit, windowMs);
    memory.set(id, l);
  }
  return l;
}

const DB_TIMEOUT_MS = 1500;

/**
 * 한 가지 키에 대한 제한 확인. 서버 메모리에서 먼저 세고(DB 가 느리거나 없어도 최소한의 방어),
 * DB(rate_limit_take 함수)가 있으면 여러 서버가 함께 세요. DB 가 실패하면 메모리 결과만 써요.
 */
export async function takeLimit(name: string, subject: string, limit: number, windowMs: number): Promise<Limit> {
  const mem = memoryLimiter(name, limit, windowMs).check(subject);
  if (!mem.ok) return mem;
  const config = loadDbConfig(process.env);
  if (!config) return mem;
  try {
    const retry = await Promise.race([
      createDb(config).takeRateLimit(`${name}:${subject}`, Math.ceil(windowMs / 1000), limit),
      new Promise<null>((r) => setTimeout(() => r(null), DB_TIMEOUT_MS)),
    ]);
    if (typeof retry === "number" && retry > 0) return { ok: false, retryAfterSec: retry };
  } catch {
    // 함수를 아직 안 만들었거나 DB 가 잠깐 안 될 때는 메모리 제한만으로 계속해요.
  }
  return { ok: true };
}

export interface LimitSpec {
  /** 제한 이름 (엔드포인트별로 따로 세요) */
  name: string;
  windowMs: number;
  /** 주소(IP)당 한도. 로그인한 사람은 공용 주소(회사·학교)에 묶이지 않게 ipLoggedIn 배(기본 3배)까지 봐줘요 */
  ip: number;
  /** 로그인한 회원 1명당 한도 */
  user: number;
  ipLoggedInFactor?: number;
}

/** 주소 기준 + (로그인했다면) 계정 기준으로 제한을 확인해요. 걸리면 429 응답, 통과면 null. */
export async function enforceLimits(request: Request, spec: LimitSpec, message = "요청이 너무 빨라요. 잠시 뒤에 다시 시도해 주세요."): Promise<NextResponse | null> {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const ipLimit = session ? spec.ip * (spec.ipLoggedInFactor ?? 3) : spec.ip;
  const checks: Array<Promise<Limit>> = [takeLimit(spec.name, `ip:${clientKey(request)}`, ipLimit, spec.windowMs)];
  if (session) checks.push(takeLimit(spec.name, `u:${session.sub}`, spec.user, spec.windowMs));
  for (const r of await Promise.all(checks)) {
    if (!r.ok) return NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } });
  }
  return null;
}

import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/** 로그인 선물: 계정마다 한 번만 받는 500원 무료 뽑기 1회 */
const LOGIN_BONUS = { kind: "login_bonus", ref: "v1", amount: 1 } as const;

/**
 * 내 뽑기 코인을 확인하고, 아직 못 받은 로그인 선물이 있으면 지급해요. (몇 번 불러도 한 번만 지급돼요)
 * 로그인하지 않았거나 DB 가 없으면 0장으로 돌려줘서 화면이 그대로 동작해요.
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "coins", windowMs: 60_000, ip: 30, user: 20 }));
  if (denied) return denied;

  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const config = loadDbConfig(process.env);
  const none = { balance: 0, granted: false };
  if (!session || !config) return NextResponse.json(none, { headers: { "Cache-Control": "no-store" } });
  const db = createDb(config);
  try {
    await db.ensureUser(session.sub, session.nick);
    const r = await db.grantCoin(session.sub, LOGIN_BONUS.kind, LOGIN_BONUS.ref, LOGIN_BONUS.amount);
    return NextResponse.json({ balance: r.balance, granted: r.granted }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // 코인 테이블을 아직 만들지 않았거나 DB 가 잠깐 안 될 때: 기능만 쉬고 서비스는 그대로예요.
    console.error("coins failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(none, { headers: { "Cache-Control": "no-store" } });
  }
}

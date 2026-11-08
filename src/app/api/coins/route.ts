import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/**
 * 내 뽑기 코인을 확인해요. (11-08부터 로그인 선물 동전은 주지 않아요. 처음 로그인한 회원인지만 표시해서 신규 가입 집계에 써요)
 * granted 는 "처음 로그인했다"는 뜻이에요. 로그인하지 않았거나 DB 가 없으면 0장으로 돌려줘서 화면이 그대로 동작해요.
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
    const first = await db.markWelcome(session.sub).catch(() => false);
    const balance = await db.getCoins(session.sub);
    return NextResponse.json({ balance, granted: first }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // 코인 테이블을 아직 만들지 않았거나 DB 가 잠깐 안 될 때: 기능만 쉬고 서비스는 그대로예요.
    console.error("coins failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(none, { headers: { "Cache-Control": "no-store" } });
  }
}

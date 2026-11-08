import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { groupCoinLog } from "@/lib/coinHistory";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

/** 지갑 페이지용: 내 잔액(조약돌 개수)과 최근 내역. 로그인한 본인 것만, 종류·개수·시각만 돌려줘요. */
export async function GET(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "coins-history", windowMs: 60_000, ip: 30, user: 20 }));
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401, headers: NO_STORE });
  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ balance: 0, items: [] }, { headers: NO_STORE });
  const db = createDb(config);
  try {
    const [balance, rows] = await Promise.all([db.getCoins(session.sub), db.listCoinLog(session.sub)]);
    return NextResponse.json({ balance, items: groupCoinLog(rows) }, { headers: NO_STORE });
  } catch (err) {
    console.error("coin history failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "지갑을 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502, headers: NO_STORE });
  }
}

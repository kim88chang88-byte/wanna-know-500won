import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { DEMO_COINS, DEMO_KIND, DEMO_MONTH_CAP, parseDemoProduct } from "@/lib/demoBuy";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/**
 * 베타 구매 체험. 실제 결제는 없고, 상품에 맞는 동전만 지급해요. (한 계정 한 달에 DEMO_MONTH_CAP 번)
 * 결제 금액·카드 정보는 받지도 기록하지도 않아요.
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "demo-buy", windowMs: 60_000, ip: 10, user: 5 }));
  if (denied) return denied;
  const headers = { "Cache-Control": "no-store" };

  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "login" }, { status: 401, headers });

  const body = (await request.json().catch(() => null)) as { product?: unknown } | null;
  const product = parseDemoProduct(body?.product);
  if (!product) return NextResponse.json({ error: "bad" }, { status: 400, headers });

  const config = loadDbConfig(process.env);
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
  const db = createDb(config);
  try {
    await db.ensureUser(session.sub, session.nick);
    const r = await db.grantCoinCapped(session.sub, DEMO_KIND, randomUUID(), DEMO_MONTH_CAP, DEMO_COINS[product]);
    if (r.reason === "cap") return NextResponse.json({ error: "cap", balance: r.balance }, { status: 429, headers });
    if (!r.granted) return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
    return NextResponse.json({ ok: true, coins: DEMO_COINS[product], balance: r.balance }, { headers });
  } catch (err) {
    console.error("demo-buy failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
  }
}

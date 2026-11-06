import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { DEMO_COINS, DEMO_KIND, DEMO_MONTH_CAP, parseDemoProduct } from "@/lib/demoBuy";
import { isAdmin } from "@/lib/admin/auth";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

const ADMIN_MONTH_CAP = 1000;
/** coin_grant 한 번에 받을 수 있는 최대 개수 (supabase/schema.sql) */
const MAX_GRANT = 10;

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
    // 개발·테스트용: 관리자(ADMIN_USER_IDS)는 한 달 체험 횟수 제한을 크게 풀어 둬요.
    const cap = isAdmin(session.sub, process.env) ? ADMIN_MONTH_CAP : DEMO_MONTH_CAP;
    // DB 의 coin_grant 는 한 번에 최대 10개까지만 받아요. 그보다 크면(프리미엄 19개) 나눠서 지급해요.
    // 횟수 제한은 첫 묶음에만 세어서, 한 번 구매가 한 번으로 계산돼요.
    const total = DEMO_COINS[product];
    const first = Math.min(total, MAX_GRANT);
    const r = await db.grantCoinCapped(session.sub, DEMO_KIND, randomUUID(), cap, first);
    if (r.reason === "cap") return NextResponse.json({ error: "cap", balance: r.balance }, { status: 429, headers });
    if (!r.granted) return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
    let balance = r.balance;
    for (let left = total - first; left > 0; left -= MAX_GRANT) {
      const g = await db.grantCoin(session.sub, `${DEMO_KIND}_more`, randomUUID(), Math.min(left, MAX_GRANT));
      if (!g.granted) return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
      balance = g.balance;
    }
    return NextResponse.json({ ok: true, coins: total, balance }, { headers });
  } catch (err) {
    console.error("demo-buy failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers });
  }
}

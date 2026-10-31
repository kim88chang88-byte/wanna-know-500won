import { NextResponse } from "next/server";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { cleanRefCode } from "@/lib/referral";

export const runtime = "nodejs";

/**
 * 친구 초대.
 *  - 본문이 비어 있으면: 내 추천 코드와 초대 현황을 돌려줘요.
 *  - { code } 가 있으면: 친구의 코드를 입력해요. (가입 후 7일 안, 아직 뽑기를 해 보지 않은 계정만)
 * 보상은 여기서 주지 않아요. 초대받은 친구가 첫 풀이를 마칠 때 /api/reading 이 두 사람에게 지급해요.
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "referral", windowMs: 60_000, ip: 20, user: 12 }));
  if (denied) return denied;

  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  const config = loadDbConfig(process.env);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const db = createDb(config);
  const noStore = { "Cache-Control": "no-store" };
  try {
    await db.ensureUser(session.sub, session.nick);
    if (body && body.code !== undefined) {
      const code = cleanRefCode(body.code);
      if (!code) return NextResponse.json({ result: "bad_code" }, { headers: noStore });
      return NextResponse.json({ result: await db.redeemReferral(session.sub, code) }, { headers: noStore });
    }
    const [code, stats] = await Promise.all([db.referralCode(session.sub), db.referralStats(session.sub)]);
    return NextResponse.json({ code, done: stats.done, pending: stats.pending }, { headers: noStore });
  } catch (err) {
    console.error("referral failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

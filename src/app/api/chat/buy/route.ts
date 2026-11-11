import { NextResponse } from "next/server";
import { BUY_AMOUNT } from "@/lib/chatQuota";
import { canChat, dbOrNull, parseCtx, sessionOf, targetOf } from "@/lib/chatServer";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/** 조약돌 1장으로 질문 5개를 더해요. 조약돌이 없으면 409 (코드 no_coin). */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chat-buy", windowMs: 60000, ip: 10, user: 10 }));
  if (denied) return denied;
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  if (!canChat(session.sub)) return NextResponse.json({ error: "도유 상담방은 곧 열려." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { ctx?: unknown } | null;
  const ctx = parseCtx(body?.ctx);
  if (!ctx) return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });
  const db = dbOrNull();
  if (!db) return NextResponse.json({ error: "지금은 조약돌을 쓸 수 없어." }, { status: 503 });
  const t = targetOf(session.sub, ctx);
  try {
    const r = await db.chatBuy(t.user, t.scope, t.free, BUY_AMOUNT);
    if (r.left < 0) return NextResponse.json({ error: "조약돌이 없어.", code: "no_coin", coins: 0 }, { status: 409 });
    return NextResponse.json({ left: r.left, coins: r.coins, added: BUY_AMOUNT });
  } catch (err) {
    console.error("chatBuy failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "조약돌을 쓰지 못했어. 잠시 뒤에 다시 시도해 줘." }, { status: 502 });
  }
}

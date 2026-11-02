import { NextResponse } from "next/server";
import { BUY_AMOUNT } from "@/lib/chatQuota";
import { canChat, dbOrNull, parseCtx, sessionOf, targetOf } from "@/lib/chatServer";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/** 뽑기 코인 1장으로 질문 5개를 더해요. 코인이 없으면 409 (코드 no_coin). */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chat-buy", windowMs: 60000, ip: 10, user: 10 }));
  if (denied) return denied;
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!canChat(session.sub)) return NextResponse.json({ error: "도리 상담방은 곧 열려요." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { ctx?: unknown } | null;
  const ctx = parseCtx(body?.ctx);
  if (!ctx) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const db = dbOrNull();
  if (!db) return NextResponse.json({ error: "지금은 코인을 쓸 수 없어요." }, { status: 503 });
  const t = targetOf(session.sub, ctx);
  try {
    const r = await db.chatBuy(t.user, t.scope, t.free, BUY_AMOUNT);
    if (r.left < 0) return NextResponse.json({ error: "뽑기 코인이 없어요.", code: "no_coin", coins: 0 }, { status: 409 });
    return NextResponse.json({ left: r.left, coins: r.coins, added: BUY_AMOUNT });
  } catch (err) {
    console.error("chatBuy failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "코인을 쓰지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502 });
  }
}

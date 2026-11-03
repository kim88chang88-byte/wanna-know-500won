import { NextResponse } from "next/server";
import { canChat, dbOrNull, parseCtx, quotaLeft, sessionOf, targetOf } from "@/lib/chatServer";
import { enforceLimits, guardOrigin } from "@/lib/guard";

export const runtime = "nodejs";

/** 상담방에 들어올 때 남은 질문 수와 내 뽑기 코인 수를 알려줘요. (질문을 쓰지 않아요) */
export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chat-quota", windowMs: 60000, ip: 30, user: 30 }));
  if (denied) return denied;
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!canChat(session.sub)) return NextResponse.json({ error: "도리 상담방은 곧 열려요." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { ctx?: unknown } | null;
  const ctx = parseCtx(body?.ctx ?? { kind: "daily" });
  if (!ctx) return NextResponse.json({ error: "요청이 올바르지 않아요. 다시 한 번 확인해 주세요." }, { status: 400 });
  const db = dbOrNull();
  const left = await quotaLeft(db, targetOf(session.sub, ctx));
  let coins = 0;
  try {
    coins = db ? await db.getCoins(session.sub) : 0;
  } catch {
    /* 코인 조회 실패는 0장으로 보여요 */
  }
  return NextResponse.json({ left, coins }, { headers: { "Cache-Control": "no-store" } });
}

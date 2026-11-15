import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { buildCoreFacts, factsNowFor } from "@/lib/ai/coreFacts";
import { buildReadingMemo } from "@/lib/ai/chatMemo";
import { chatDori, CRISIS_ANSWER, isCrisis } from "@/lib/ai/chat";
import { EVAL_LOVE, EVAL_MENU } from "@/lib/ai/evalSets";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { hasAiKey } from "@/lib/ai/llm";
import { unableReply } from "@/lib/ai/outOfScope";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { dbOrNull } from "@/lib/chatServer";
import { guardOrigin, takeLimit } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";

export const runtime = "nodejs";
export const maxDuration = 60;
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * 관리자 전용: 상담실 질문 점검. 질문 하나를 실제 도리 방식(위기 확인 → 미리 거르기 → AI)으로 돌려서 답을 보여 줘요.
 * 질문 횟수·조약돌·하루 상한은 쓰지 않아요. 내 저장된 생년월일시로 "연애운 풀이" 방에서 묻는 것처럼 돌려요.
 */
export async function POST(request: Request) {
  const denied = guardOrigin(request);
  if (denied) return denied;
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  // 비용이 새지 않게 한 시간에 120번까지만
  const cap = await takeLimit("chat-eval", `u:${session.sub}`, 120, 60 * 60 * 1000);
  if (!cap.ok) return NextResponse.json({ error: "점검을 너무 많이 돌렸어. 한 시간 뒤에 다시 해 줘." }, { status: 429, headers: NO_STORE });

  let body: { set?: unknown; index?: unknown } | null;
  try {
    body = (await request.json()) as { set?: unknown; index?: unknown };
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아." }, { status: 400, headers: NO_STORE });
  }
  const isMenu = body?.set === "menu";
  const set = isMenu ? EVAL_MENU : EVAL_LOVE;
  const i = typeof body?.index === "number" ? Math.floor(body.index) : -1;
  if (i < 0 || i >= set.length) return NextResponse.json({ error: "질문 번호가 올바르지 않아." }, { status: 400, headers: NO_STORE });
  const item = set[i];
  const t0 = Date.now();
  if (isCrisis(item.q)) return NextResponse.json({ q: item.q, expect: item.expect ?? null, route: "crisis", answer: CRISIS_ANSWER, ms: Date.now() - t0 }, { headers: NO_STORE });
  const un = unableReply(item.q);
  if (un) return NextResponse.json({ q: item.q, expect: item.expect ?? null, route: "prefilter", answer: un.answer, links: un.links, ms: Date.now() - t0 }, { headers: NO_STORE });
  if (!hasAiKey()) return NextResponse.json({ error: "AI 키가 없어." }, { status: 503, headers: NO_STORE });
  const db = dbOrNull();
  const profile = db ? await db.getProfile(session.sub) : null;
  if (!profile) return NextResponse.json({ error: "내 정보를 먼저 저장해 줘." }, { status: 404, headers: NO_STORE });
  try {
    const now = new Date();
    const birth = resolveBirth(profile).input;
    const chart = calculateSaju(birth);
    const core = buildCoreFacts(birth, factsNowFor(null, now), true);
    const memo = buildReadingMemo(chart, core, factsNowFor(null, now));
    const reply = await chatDori(
      { kind: "reading", name: null, partnerName: null, summary: isMenu ? "사주 풀이 결과서를 읽고 온 상담방. 오늘의 메뉴와 취미를 묻는 중" : "연애운 풀이. 연애와 결혼에 대한 고민을 이야기하는 방", chart, core, daily: isMenu ? buildDailyFacts(chart, kstToday(now)) : null, partnerChart: null, memo },
      [{ role: "user", text: item.q }],
      { now },
    );
    return NextResponse.json(
      { q: item.q, expect: item.expect ?? null, route: reply.unable ? "ai-unable" : "ai", answer: reply.answer, followups: reply.followups, choices: reply.choices, visual: reply.visual ? reply.visual.kind : null, ms: Date.now() - t0 },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("chat-eval failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ q: item.q, expect: item.expect ?? null, route: "error", answer: "", ms: Date.now() - t0 }, { headers: NO_STORE });
  }
}

export async function GET(request: Request) {
  const menu = new URL(request.url).searchParams.get("set") === "menu";
  return NextResponse.json({ total: (menu ? EVAL_MENU : EVAL_LOVE).length }, { headers: NO_STORE });
}

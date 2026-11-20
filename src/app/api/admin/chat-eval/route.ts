import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { buildCoreFacts, factsNowFor } from "@/lib/ai/coreFacts";
import { buildCompatMemo, buildReadingMemo } from "@/lib/ai/chatMemo";
import { chatDori, CRISIS_ANSWER, isCrisis } from "@/lib/ai/chat";
import { EVAL_CATALOG, evalCategory } from "@/lib/ai/evalSets";
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
  const cat = evalCategory(body?.set);
  const set = cat.qs;
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
    const factsNow = factsNowFor(cat.topic ?? null, now);
    const core = buildCoreFacts(birth, factsNow, true);
    // 궁합 점검은 고정된 예시 상대(1994-03-15 낮 12시)와 함께 돌려요. 성별은 내 성별과 반대로 놓아요.
    const partnerChart = cat.kind === "compat" ? calculateSaju({ year: 1994, month: 3, day: 15, hour: 12, minute: 0, calendar: "solar", gender: birth.gender === "male" ? "female" : "male" }) : null;
    const memo = cat.kind === "compat" && partnerChart ? buildCompatMemo(chart, partnerChart, { me: null, partner: "상대" }) : buildReadingMemo(chart, core, factsNow);
    const info = { kind: cat.kind, name: null, partnerName: cat.kind === "compat" ? "상대" : null, summary: cat.summary, chart, core, daily: cat.daily ? buildDailyFacts(chart, kstToday(now)) : null, partnerChart, memo };
    const turns = [item.q, ...(item.next ?? [])];
    const history: Array<{ role: "user" | "dori"; text: string }> = [];
    const texts: string[] = [];
    let last = null as Awaited<ReturnType<typeof chatDori>> | null;
    for (let t = 0; t < turns.length; t++) {
      history.push({ role: "user", text: turns[t] });
      const reply = await chatDori({ ...info, memo: t === 0 ? memo : undefined }, history, { now });
      history.push({ role: "dori", text: reply.answer });
      last = reply;
      const extra = [reply.choices.length ? `선택지: ${reply.choices.join(" / ")}` : "", reply.followups.length ? `다음 질문 칩: ${reply.followups.join(" / ")}` : ""].filter(Boolean).join("\n");
      texts.push(turns.length > 1 ? `▶ ${turns[t]}\n${reply.answer}${extra ? `\n(${extra})` : ""}` : reply.answer);
    }
    const reply = last as NonNullable<typeof last>;
    return NextResponse.json(
      { q: item.q, expect: item.expect ?? null, route: reply.unable ? "ai-unable" : "ai", answer: texts.join("\n\n"), followups: reply.followups, choices: reply.choices, visual: reply.visual ? reply.visual.kind : null, ms: Date.now() - t0 },
      { headers: NO_STORE },
    );
  } catch (err) {
    console.error("chat-eval failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ q: item.q, expect: item.expect ?? null, route: "error", answer: "", ms: Date.now() - t0 }, { headers: NO_STORE });
  }
}

export async function GET(request: Request) {
  const which = new URL(request.url).searchParams.get("set");
  // set 이 없으면 점검 카테고리 목록을 돌려줘요 (화면의 버튼이 이걸로 만들어져요)
  if (!which) return NextResponse.json({ categories: EVAL_CATALOG.map((c) => ({ id: c.id, label: c.label, group: c.group, total: c.qs.length })) }, { headers: NO_STORE });
  return NextResponse.json({ total: evalCategory(which).qs.length }, { headers: NO_STORE });
}

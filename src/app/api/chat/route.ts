import { NextResponse } from "next/server";
import { takeAiBudget } from "@/lib/ai/budget";
import { chatDori, cleanHistory, CRISIS_ANSWER, isCrisis } from "@/lib/ai/chat";
import { buildCoreFacts } from "@/lib/ai/coreFacts";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { hasAiKey } from "@/lib/ai/llm";
import { DAY_CAP } from "@/lib/chatQuota";
import { canChat, dbOrNull, parseCtx, quotaLeft, refundQuestion, sessionOf, takeQuestion, targetOf } from "@/lib/chatServer";
import { enforceLimits, guardOrigin, takeLimit } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 화면이 "도리에게 더 물어보기" 버튼을 보여 줄지 물어봐요. */
export async function GET(request: Request) {
  const s = sessionOf(request);
  return NextResponse.json({ enabled: canChat(s?.sub) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chat", windowMs: 60000, ip: 10, user: 12 }, "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요."));
  if (denied) return denied;
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!canChat(session.sub)) return NextResponse.json({ error: "도리 상담방은 곧 열려요. 조금만 기다려 주세요 🫧" }, { status: 403 });

  let body: { ctx?: unknown; messages?: unknown } | null;
  try {
    body = (await request.json()) as { ctx?: unknown; messages?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const ctx = parseCtx(body?.ctx);
  const history = cleanHistory(body?.messages);
  if (!ctx || !history) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

  const db = dbOrNull();
  const target = targetOf(session.sub, ctx);

  // 마음이 힘든 말은 AI 를 부르지 않고 안내만 해요. (질문 횟수도 쓰지 않아요)
  const last = history[history.length - 1].text;
  if (isCrisis(last)) return NextResponse.json({ answer: CRISIS_ANSWER, safe: true, left: await quotaLeft(db, target) });

  if (!hasAiKey()) return NextResponse.json({ error: "지금은 도리가 답을 준비하지 못했어요." }, { status: 503 });

  let taken: { left: number; via: "db" | "mem" } | null = null;
  try {
    // 누구의 사주인지: 결과서에서 왔으면 그 풀이의 생년월일시, 오늘 카드면 저장된 내 정보
    let birth = ctx.birth;
    if (ctx.kind === "daily" || !birth) {
      const profile = db ? await db.getProfile(session.sub) : null;
      if (!profile) return NextResponse.json({ error: "내 정보를 먼저 저장해 주세요." }, { status: 404 });
      birth = resolveBirth(profile).input;
    }
    const chart = calculateSaju(birth);
    const partnerChart = ctx.partnerBirth ? calculateSaju(ctx.partnerBirth) : null;

    const gate = await takeAiBudget(process.env, db);
    if (gate !== "ok") throw new ReadingUnavailableError();

    // 하루에 한 사람이 보낼 수 있는 전체 질문 수 (범위가 달라도 합쳐서)
    const day = await takeLimit("chat-day", `u:${session.sub}`, DAY_CAP, 24 * 60 * 60 * 1000);
    if (!day.ok) return NextResponse.json({ error: "오늘은 도리가 질문을 많이 받았어요. 내일 다시 물어봐 주세요 🫧", code: "day_cap", left: 0 }, { status: 429 });

    taken = await takeQuestion(db, target);
    if (taken.left < 0) {
      return NextResponse.json({ error: "질문을 모두 사용했어요. 500원 동전으로 질문을 더할 수 있어요.", code: "quota", left: 0 }, { status: 402 });
    }

    const now = new Date();
    const answer = await chatDori(
      {
        kind: ctx.kind,
        name: ctx.name,
        partnerName: ctx.partnerName,
        summary: ctx.summary,
        chart,
        core: buildCoreFacts(birth, now, true),
        daily: ctx.kind === "daily" ? buildDailyFacts(chart, kstToday(now)) : null,
        partnerChart,
      },
      history,
    );
    return NextResponse.json({ answer, left: taken.left });
  } catch (err) {
    // 답을 못 만들었으면 쓴 질문을 돌려줘요.
    if (taken && taken.left >= 0) await refundQuestion(db, target, taken.via);
    if (err instanceof SajuInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 주세요 🫧" }, { status: 503 });
    console.error("chat failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 보내 볼래요?" }, { status: 502 });
  }
}

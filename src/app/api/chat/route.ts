import { isOutfitQuestion, pickOutfit } from "@/lib/outfits";
import { NextResponse } from "next/server";
import { takeAiBudget } from "@/lib/ai/budget";
import { chatDori, checkRisk, cleanHistory, CRISIS_ANSWER, isCrisis } from "@/lib/ai/chat";
import { greetingReply, isFirstAsk, withoutCrisisTurns } from "@/lib/ai/chatFlow";
import { apologyFirst, REFUND_DAY_CAP, REFUND_NOTICE, unableReply } from "@/lib/ai/outOfScope";
import { buildCoreFacts, factsNowFor } from "@/lib/ai/coreFacts";
import { futureFacts } from "@/lib/ai/futureFacts";
import { parseAbout } from "@/lib/chatServer";
import { buildChatMemo, buildCompatMemo, buildMonthMemo, buildReadingMemo, MONTH_ASK, type ChatMemo } from "@/lib/ai/chatMemo";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { hasAiKey } from "@/lib/ai/llm";
import { DAY_CAP } from "@/lib/chatQuota";
import { canChat, chatServerCap, dbOrNull, parseCtx, quotaLeft, refundQuestion, sessionOf, takeQuestion, targetOf } from "@/lib/chatServer";
import { isAdmin } from "@/lib/admin/auth";
import { enforceLimits, guardOrigin, refundLimit, takeLimit } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 화면이 "도리에게 더 물어보기" 버튼을 보여 줄지 물어봐요. */
export async function GET(request: Request) {
  const s = sessionOf(request);
  return NextResponse.json({ enabled: canChat(s?.sub), loggedIn: Boolean(s) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "chat", windowMs: 60000, ip: 10, user: 12 }, "질문이 너무 빨라. 잠시 뒤에 다시 물어봐 줘."));
  if (denied) return denied;
  const session = sessionOf(request);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401 });
  if (!canChat(session.sub)) return NextResponse.json({ error: "도유 상담방은 곧 열려. 조금만 기다려 줘 ❄️" }, { status: 403 });

  let body: { ctx?: unknown; messages?: unknown; about?: unknown } | null;
  try {
    body = (await request.json()) as { ctx?: unknown; messages?: unknown; about?: unknown };
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });
  }
  const ctx = parseCtx(body?.ctx);
  const history = cleanHistory(body?.messages);
  if (!ctx || !history) return NextResponse.json({ error: "요청이 올바르지 않아. 다시 한 번 확인해 줘." }, { status: 400 });

  const db = dbOrNull();
  const target = targetOf(session.sub, ctx);

  // 마음이 힘든 말은 AI 를 부르지 않고 안내만 해요. (질문 횟수도 쓰지 않아요)
  const last = history[history.length - 1].text;
  if (isCrisis(last)) return NextResponse.json({ answer: CRISIS_ANSWER, safe: true, left: await quotaLeft(db, target) });

  // 도리가 정확하게 답할 수 없는 질문(가게 이름·실시간 정보·투자 종목)은 AI 를 부르지 않고 사과와 대안만 보내요. 질문은 쓰지 않아요.
  const unable = unableReply(last);
  if (unable) return NextResponse.json({ answer: unable.answer, links: unable.links, followups: unable.followups, unable: true, left: await quotaLeft(db, target) });

  // 인사만 보낸 말("안녕", "하이")은 AI 를 부르지 않고 정해 둔 답으로 받아요. 질문도 쓰지 않아요.
  const hello = greetingReply(history);
  if (hello) return NextResponse.json({ answer: hello, greeting: true, left: await quotaLeft(db, target) });

  if (!hasAiKey()) return NextResponse.json({ error: "지금은 도리가 답을 준비하지 못했어." }, { status: 503 });

  // 말 고르기를 빠져나간 돌려 말하기: 모든 질문을 짧은 분류 호출로 한 번 더 살펴요(글자 힌트에 기대지 않아요). 위험이면 안내만 보내고, 질문은 아직 쓰기 전이라 쓰지 않아요.
  try {
    if (await checkRisk(history)) return NextResponse.json({ answer: CRISIS_ANSWER, safe: true, left: await quotaLeft(db, target) });
  } catch {
    /* 분류가 실패하면 평소 흐름으로 이어가요 (아래에서 답 안의 위험 표시로 한 번 더 살펴요) */
  }

  let taken: { left: number; via: "db" | "mem" } | null = null;
  let dayTaken = false;
  const DAY_MS = 24 * 60 * 60 * 1000;
  try {
    // 누구의 사주인지: 결과서에서 왔으면 그 풀이의 생년월일시, 오늘 카드면 저장된 내 정보
    let birth = ctx.birth;
    if (ctx.kind === "daily" || !birth) {
      const profile = db ? await db.getProfile(session.sub) : null;
      if (!profile) return NextResponse.json({ error: "내 정보를 먼저 저장해 줘." }, { status: 404 });
      birth = resolveBirth(profile).input;
    }
    const selfBirth = birth;
    // 사용자가 "다른 사람 사주로 보기"를 골랐으면 그 사람의 사주가 주인공이에요(궁합방은 제외)
    const about = ctx.kind === "compat" ? null : parseAbout(body?.about);
    if (about) birth = about.birth;
    const chart = calculateSaju(birth);
    const askerChart = about ? calculateSaju(selfBirth) : null;
    const partnerChart = ctx.partnerBirth ? calculateSaju(ctx.partnerBirth) : null;

    const gate = await takeAiBudget(process.env, db);
    if (gate !== "ok") throw new ReadingUnavailableError();

    // 서버 전체가 하루에 받는 상담 질문 상한 (한꺼번에 몰려도 AI 비용이 정해진 선을 넘지 않게)
    const all = await takeLimit("chat-all", "server", chatServerCap(process.env), 24 * 60 * 60 * 1000);
    if (!all.ok) throw new ReadingUnavailableError();

    // 하루에 한 사람이 보낼 수 있는 전체 질문 수 (범위가 달라도 합쳐서)
    // 관리자(테스트 계정)는 이 한도에서 빼요.
    if (!isAdmin(session.sub, process.env)) {
      const day = await takeLimit("chat-day", `u:${session.sub}`, DAY_CAP, DAY_MS);
      if (!day.ok) return NextResponse.json({ error: "오늘은 도리가 질문을 많이 받았어. 내일 다시 물어봐 줘 ❄️", code: "day_cap", left: 0 }, { status: 429 });
      dayTaken = true;
    }

    taken = await takeQuestion(db, target);
    // 횟수가 어떻게 줄었는지 기록해요(사용자 번호는 남기지 않아요). via 가 mem 이면 DB 대신 서버 메모리로 센 거예요.
    console.info("chat take:", JSON.stringify({ kind: ctx.kind, left: taken.left, via: taken.via, admin: isAdmin(session.sub, process.env) }));
    if (taken.left < 0) {
      if (dayTaken) await refundLimit("chat-day", `u:${session.sub}`, DAY_CAP, DAY_MS);
      return NextResponse.json({ error: "질문을 모두 사용했어. 조약돌 하나로 질문을 5번 더 할 수 있어.", code: "quota", left: 0 }, { status: 402 });
    }

    const now = new Date();
    const core = buildCoreFacts(birth, factsNowFor(ctx.topic, now), true);
    const daily = ctx.kind === "daily" ? buildDailyFacts(chart, kstToday(now)) : null;
    // 첫 질문에는 들어온 곳에 맞는 "도리 메모"를 붙여요 (코드 계산, AI 비용 없음). 답도 이 메모를 근거로 삼아요.
    const firstAsk = isFirstAsk(history);
    let memo: ChatMemo | null = null;
    const aboutName = about?.name ?? null;
    const lastQuestion = [...history].reverse().find((m) => m.role === "user")?.text ?? "";
    // 시기·두 갈래 질문(풀이에서 들어온 경우)에는 첫 질문이 아니어도 지금부터 몇 달의 "월운 계산" 메모를 붙여요.
    // 같은 월운 카드를 질문마다 또 붙이지 않아요(앞선 질문에서 이미 보여 줬으면 건너뜀)
    const monthShown = history.slice(0, -1).some((m) => m.role === "user" && MONTH_ASK.test(m.text));
    if (about) {
      memo = null; // 다른 사람 풀이에는 사용자 본인의 오늘 메모를 붙이지 않아요
    } else if (ctx.kind === "reading" && MONTH_ASK.test(lastQuestion) && !monthShown) {
      memo = buildMonthMemo(chart, core, now, lastQuestion);
    } else if (firstAsk) {
      if (ctx.kind === "daily" && daily) memo = buildChatMemo(daily, kstToday(now));
      else if (ctx.kind === "compat" && partnerChart) memo = buildCompatMemo(chart, partnerChart, { me: ctx.name, partner: ctx.partnerName });
      else if (ctx.kind === "reading") memo = buildReadingMemo(chart, core, factsNowFor(ctx.topic, now));
    }
    const future = ctx.topic === "study" ? null : futureFacts(birth, lastQuestion, now);
    const reply = await chatDori(
      {
        future,
        about: about && aboutName ? { name: aboutName, asker: askerChart } : null,
        kind: ctx.kind,
        name: ctx.name,
        partnerName: ctx.partnerName,
        summary: ctx.summary,
        chart,
        core,
        daily,
        partnerChart,
        memo,
      },
      withoutCrisisTurns(history),
      { now },
    );
    // 도리가 "자해·자살 위험이 보인다"고 표시한 답(말 고르기로 못 거른 돌려 말하기): AI 답 대신 정해 둔 안내만 보내고 질문은 돌려줘요
    if (reply.risk) {
      if (taken && taken.left >= 0) await refundQuestion(db, target, taken.via);
      if (dayTaken) await refundLimit("chat-day", `u:${session.sub}`, DAY_CAP, DAY_MS);
      taken = null;
      dayTaken = false;
      return NextResponse.json({ answer: CRISIS_ANSWER, safe: true, left: await quotaLeft(db, target) });
    }
    // 도리가 "정확하게 답할 수 없는 질문"이라고 표시한 답: 사과로 다듬고 질문을 돌려줘요 (하루 상한 안에서만)
    if (reply.unable) {
      const refund = await takeLimit("chat-refund", `u:${session.sub}`, REFUND_DAY_CAP, DAY_MS);
      let answer = apologyFirst(reply.answer);
      let refunded = false;
      if (refund.ok) {
        if (taken && taken.left >= 0) await refundQuestion(db, target, taken.via);
        if (dayTaken) await refundLimit("chat-day", `u:${session.sub}`, DAY_CAP, DAY_MS);
        taken = null;
        dayTaken = false;
        refunded = true;
        answer += `\n\n${REFUND_NOTICE}`;
      }
      return NextResponse.json({ answer, followups: reply.followups, choices: [], visual: null, outfit: null, memo, unable: true, refunded, left: refunded ? await quotaLeft(db, target) : (taken?.left ?? 0) });
    }
    // 옷 질문이면 이용자 성별과 색에 맞는 착장 이미지를 붙여요 (미리 만든 이미지 중에서 고르기만 해서 AI 비용이 없어요)
    const paletteLabels = reply.visual?.kind === "palette" ? reply.visual.items.map((i) => i.label) : [];
    const outfit = !about && isOutfitQuestion(last) ? pickOutfit(birth.gender, last, paletteLabels) : null;
    const visual = outfit && reply.visual?.kind === "palette" ? null : reply.visual;
    // 마음을 달래는 답(🤍)에는 "가볍게 즐기면 기분이 풀리는 날" 같은 메모 카드를 붙이지 않아요
    const comfort = reply.answer.trimStart().startsWith("🤍");
    return NextResponse.json({ answer: reply.answer, followups: reply.followups, choices: reply.choices, visual, outfit, sticker: reply.sticker ?? null, memo: comfort ? null : memo, left: taken.left });
  } catch (err) {
    // 답을 못 만들었으면 쓴 질문을 돌려줘요.
    if (taken && taken.left >= 0) await refundQuestion(db, target, taken.via);
    if (dayTaken) await refundLimit("chat-day", `u:${session.sub}`, DAY_CAP, DAY_MS);
    if (err instanceof SajuInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어. 내일 다시 물어봐 줘 ❄️" }, { status: 503 });
    console.error("chat failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어. 다시 보내 볼래?" }, { status: 502 });
  }
}

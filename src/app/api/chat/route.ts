import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { takeAiBudget } from "@/lib/ai/budget";
import { chatDori, cleanHistory, CRISIS_ANSWER, isCrisis } from "@/lib/ai/chat";
import { buildCoreFacts } from "@/lib/ai/coreFacts";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { hasAiKey } from "@/lib/ai/llm";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { TURN_CAP, type ChatKind } from "@/lib/chatContext";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput } from "@/lib/saju/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 상담방을 열어 줄 사람: 지금은 관리자만. CHAT_OPEN=true 로 바꾸면 로그인한 모든 회원에게 열려요. */
function canChat(sub: string | null | undefined): boolean {
  if (!sub) return false;
  if (process.env.CHAT_OPEN?.trim().toLowerCase() === "true") return true;
  return isAdmin(sub, process.env);
}

function sessionOf(request: Request) {
  return verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
}

/** 화면이 "도리에게 더 물어보기" 버튼을 보여 줄지 물어봐요. */
export async function GET(request: Request) {
  const s = sessionOf(request);
  return NextResponse.json({ enabled: canChat(s?.sub) }, { headers: { "Cache-Control": "no-store" } });
}

function validBirth(v: unknown): BirthInput | null {
  if (typeof v !== "object" || v === null) return null;
  try {
    return resolveBirth(v as BirthInput).input;
  } catch {
    return null;
  }
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
  const ctx = (body?.ctx ?? {}) as { kind?: unknown; summary?: unknown; birth?: unknown; partnerBirth?: unknown; partnerName?: unknown; name?: unknown };
  const kind: ChatKind | null = ctx.kind === "daily" || ctx.kind === "reading" || ctx.kind === "compat" ? ctx.kind : null;
  const history = cleanHistory(body?.messages);
  if (!kind || !history) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  if (history.filter((m) => m.role === "user").length > TURN_CAP) return NextResponse.json({ error: "이번 대화는 여기까지예요. 새로 시작해서 이어 물어봐 주세요 🫧" }, { status: 429 });

  const last = history[history.length - 1].text;
  if (isCrisis(last)) return NextResponse.json({ answer: CRISIS_ANSWER, safe: true });

  if (!hasAiKey()) return NextResponse.json({ error: "지금은 도리가 답을 준비하지 못했어요." }, { status: 503 });
  try {
    const dbConfig = loadDbConfig(process.env);
    const db = dbConfig ? createDb(dbConfig) : null;

    // 누구의 사주인지: 결과서에서 왔으면 그 풀이의 생년월일시, 오늘 카드면 저장된 내 정보
    let birth = validBirth(ctx.birth);
    if (kind === "daily" || !birth) {
      const profile = db ? await db.getProfile(session.sub) : null;
      if (!profile) return NextResponse.json({ error: "내 정보를 먼저 저장해 주세요." }, { status: 404 });
      birth = resolveBirth(profile).input;
    }
    const chart = calculateSaju(birth);
    const partnerBirth = kind === "compat" ? validBirth(ctx.partnerBirth) : null;

    const gate = await takeAiBudget(process.env, db);
    if (gate !== "ok") throw new ReadingUnavailableError();
    const now = new Date();
    const answer = await chatDori(
      {
        kind,
        name: typeof ctx.name === "string" ? ctx.name.slice(0, 12) : null,
        partnerName: typeof ctx.partnerName === "string" ? ctx.partnerName.slice(0, 12) : null,
        summary: typeof ctx.summary === "string" ? ctx.summary : "",
        chart,
        core: buildCoreFacts(birth, now, true),
        daily: kind === "daily" ? buildDailyFacts(chart, kstToday(now)) : null,
        partnerChart: partnerBirth ? calculateSaju(partnerBirth) : null,
      },
      history,
    );
    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof SajuInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 주세요 🫧" }, { status: 503 });
    console.error("chat failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 보내 볼래요?" }, { status: 502 });
  }
}

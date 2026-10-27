import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { askDori } from "@/lib/ai/ask";
import { findQuestion } from "@/lib/ai/askQuestions";
import { takeAiBudget } from "@/lib/ai/budget";
import { buildCoreFacts } from "@/lib/ai/coreFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput } from "@/lib/saju/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "ask", windowMs: 60000, ip: 6, user: 12 }, "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요."));
  if (denied) return denied;
  let body: (BirthInput & { q?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { q?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const { q, ...input } = body;
  const question = findQuestion(q);
  if (!question) return NextResponse.json({ error: "알 수 없는 질문이에요." }, { status: 400 });

  let chart;
  try {
    chart = calculateSaju(resolveBirth(input).input);
  } catch (err) {
    if (err instanceof SajuInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했어요." }, { status: 500 });
  }

  if (!hasAiKey()) return NextResponse.json({ error: "지금은 도리가 답을 준비하지 못했어요." }, { status: 503 });
  try {
    const dbConfig = loadDbConfig(process.env);
    const db = dbConfig ? createDb(dbConfig) : null;
    const gate = await takeAiBudget(process.env, db);
    if (gate !== "ok") throw new ReadingUnavailableError();
    const core = buildCoreFacts(input, new Date(), true);
    const answer = await askDori({ chart, gender: input.gender, question, core });
    return NextResponse.json({ id: question.id, answer });
  } catch (err) {
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 주세요 🫧" }, { status: 503 });
    console.error("askDori failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?" }, { status: 502 });
  }
}

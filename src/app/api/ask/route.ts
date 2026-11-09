import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { askDori } from "@/lib/ai/ask";
import { findQuestion } from "@/lib/ai/askQuestions";
import { takeAiBudget } from "@/lib/ai/budget";
import { buildCoreFacts, factsNowFor } from "@/lib/ai/coreFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { requireLogin } from "@/lib/auth/requireLogin";
import { checkUserAiCap } from "@/lib/userAiCap";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput } from "@/lib/saju/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const loginNeeded = guardOrigin(request) ?? requireLogin(request);
  if (loginNeeded) return loginNeeded;
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "ask", windowMs: 60000, ip: 6, user: 12 }, "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요."));
  if (denied) return denied;
  const capped = await checkUserAiCap(request, "normal");
  if (capped) return capped;
  let body: (BirthInput & { q?: unknown; topic?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { q?: unknown; topic?: unknown };
  } catch {
    return NextResponse.json({ error: "요청이 올바르지 않아요. 다시 한 번 확인해 주세요." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ error: "요청이 올바르지 않아요. 다시 한 번 확인해 주세요." }, { status: 400 });
  const { q, topic: rawTopic, ...input } = body;
  const topic = rawTopic === "study" ? "study" : null;
  const question = findQuestion(q, topic);
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
    const core = buildCoreFacts(input, factsNowFor(topic, new Date()), true);
    const answer = await askDori({ chart, gender: input.gender, question, core });
    return NextResponse.json({ id: question.id, answer });
  } catch (err) {
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 주세요 ❄️" }, { status: 503 });
    console.error("askDori failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?" }, { status: 502 });
  }
}

import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { takeAiBudget } from "@/lib/ai/budget";
import { buildCoreFacts } from "@/lib/ai/coreFacts";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { crossMbti, parseMbti } from "@/lib/ai/mbti";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput } from "@/lib/saju/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "mbti", windowMs: 60000, ip: 4, user: 8 }, "요청이 너무 빨라요. 잠시 뒤에 다시 해 줘요."));
  if (denied) return denied;
  let body: (BirthInput & { mbti?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { mbti?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const { mbti: rawMbti, ...input } = body;
  const mbti = parseMbti(rawMbti);
  if (!mbti) return NextResponse.json({ error: "MBTI 를 골라 주세요." }, { status: 400 });

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
    const result = await crossMbti({ chart, gender: input.gender, mbti, core });
    return NextResponse.json({ mbti, result });
  } catch (err) {
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 줘요 🫧" }, { status: 503 });
    console.error("crossMbti failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?" }, { status: 502 });
  }
}

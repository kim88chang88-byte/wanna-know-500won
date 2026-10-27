import { hasAiKey } from "@/lib/ai/llm";
import { NextResponse } from "next/server";
import { takeAiBudget } from "@/lib/ai/budget";
import { compareHours, findCandidates, parseRange } from "@/lib/ai/hourRange";
import { ReadingUnavailableError } from "@/lib/ai/interpret";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput } from "@/lib/saju/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = guardOrigin(request) ?? (await enforceLimits(request, { name: "hours", windowMs: 60000, ip: 4, user: 8 }, "요청이 너무 빨라요. 잠시 뒤에 다시 해 주세요."));
  if (denied) return denied;
  let body: (BirthInput & { start?: unknown; end?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { start?: unknown; end?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const { start: rawStart, end: rawEnd, hour: _h, minute: _m, ...rest } = body;
  void _h;
  void _m;
  const range = parseRange(rawStart, rawEnd);
  if (!range.ok) return NextResponse.json({ error: range.error }, { status: 400 });
  const base: BirthInput = { ...rest, hour: null, minute: null };

  // 입력 검사를 겸해서 먼저 후보를 계산해 봐요. (AI 한도는 후보가 둘 이상일 때만 써요)
  try {
    findCandidates(base, range.start, range.end, () => null);
  } catch (err) {
    if (err instanceof SajuInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했어요." }, { status: 500 });
  }

  try {
    const needsAi = findCandidates(base, range.start, range.end, () => null).length > 1;
    if (needsAi) {
      if (!hasAiKey()) return NextResponse.json({ error: "지금은 도리가 답을 준비하지 못했어요." }, { status: 503 });
      const dbConfig = loadDbConfig(process.env);
      const db = dbConfig ? createDb(dbConfig) : null;
      const gate = await takeAiBudget(process.env, db);
      if (gate !== "ok") throw new ReadingUnavailableError();
    }
    const result = await compareHours({ base, start: range.start, end: range.end });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof ReadingUnavailableError) return NextResponse.json({ error: "오늘은 도리가 많이 답해서 잠깐 쉬고 있어요. 내일 다시 물어봐 주세요 🫧" }, { status: 503 });
    console.error("compareHours failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "도리가 잠깐 물놀이하러 갔어요. 다시 눌러 볼래요?" }, { status: 502 });
  }
}

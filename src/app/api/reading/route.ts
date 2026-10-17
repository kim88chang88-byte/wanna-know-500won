import { NextResponse } from "next/server";
import { interpretSaju, ReadingUnavailableError } from "@/lib/ai/interpret";
import { normalizeTopic, toPublicReading, type PublicReading } from "@/lib/ai/reading";
import { createRateLimiter } from "@/lib/rateLimit";
import { calculateSaju } from "@/lib/saju/calculate";
import { SajuInputError } from "@/lib/saju/errors";
import type { BirthInput, SajuChart } from "@/lib/saju/types";

// 풀이(AI 호출)는 오래 걸릴 수 있어서 배포 환경(Vercel)의 함수 제한 시간을 늘려 둬요.
export const maxDuration = 60;

// 풀이는 유료 API 를 쓰기 때문에, 한 주소(IP)에서 1분에 몇 번까지만 받아요. (자세한 한계는 rateLimit.ts 참고)
const limiter = createRateLimiter(6, 60_000);

type ReadingStatus = "ok" | "unavailable" | "failed";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const limit = limiter.check(clientKey(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "뽑기가 너무 빨라요. 잠시 뒤에 다시 시도해줘요." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: (BirthInput & { topic?: unknown }) | null;
  try {
    body = (await request.json()) as BirthInput & { topic?: unknown };
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { topic: rawTopic, ...input } = body;

  // TODO: 결제 확인(500원)을 통과한 요청만 전체 풀이를 주도록 연결. 지금은 항상 무료 공개 범위만 내려가요.

  let chart: SajuChart;
  try {
    chart = calculateSaju(input);
  } catch (err) {
    if (err instanceof SajuInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("calculateSaju failed", err);
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했어요." }, { status: 500 });
  }

  // 풀이가 실패해도 계산된 명식은 돌려줘서, 화면이 완전히 비지 않게 해요.
  let reading: PublicReading | null = null;
  let readingStatus: ReadingStatus = "ok";
  try {
    const full = await interpretSaju(chart, { topic: normalizeTopic(rawTopic), gender: input.gender });
    reading = toPublicReading(full, "free");
  } catch (err) {
    if (err instanceof ReadingUnavailableError) {
      readingStatus = "unavailable";
    } else {
      readingStatus = "failed";
      console.error("interpretSaju failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  return NextResponse.json({ chart, reading, readingStatus });
}

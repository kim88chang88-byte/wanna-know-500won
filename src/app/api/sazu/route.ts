import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rateLimit";
import { fetchManse, toErrorResponse } from "@/lib/sazu/client";
import { parseManseResult, validateSazuInput } from "@/lib/sazu/report";

// SAZU 호출은 월 호출 한도가 있는 외부 API 라서, 한 주소(IP)에서 1분에 5번까지만 받아요.
const limiter = createRateLimiter(5, 60_000);

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const limit = limiter.check(clientKey(request));
  if (!limit.ok) {
    return NextResponse.json(
      { code: "rate_limited", error: "요청이 너무 빨라요. 잠시 뒤에 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request", error: "잘못된 요청입니다." }, { status: 400 });
  }
  const parsed = validateSazuInput(raw);
  if (!parsed.ok) return NextResponse.json({ code: "bad_request", error: parsed.error }, { status: 400 });

  try {
    const result = await fetchManse(parsed.value);
    return NextResponse.json({ report: parseManseResult(result) });
  } catch (err) {
    const { status, body } = toErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}

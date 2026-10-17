import { NextResponse } from "next/server";
import { buildPremiumReport, validatePremiumInput } from "@/lib/premium/report";
import { createRateLimiter } from "@/lib/rateLimit";

// 계산은 가볍지만, 한 주소(IP)에서 마구 부르지 못하게 1분에 20번까지만 받아요.
const limiter = createRateLimiter(20, 60_000);

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
  const parsed = validatePremiumInput(raw);
  if (!parsed.ok) return NextResponse.json({ code: "bad_request", error: parsed.error }, { status: 400 });

  try {
    return NextResponse.json({ report: buildPremiumReport(parsed.value) });
  } catch (err) {
    // 없는 날짜(예: 윤달이 없는 해의 윤달)처럼 계산할 수 없는 입력이에요.
    console.error("premium report failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { code: "bad_request", error: "입력한 날짜로는 리포트를 만들 수 없어요. 생년월일(음력·윤달 포함)을 다시 확인해 주세요." },
      { status: 400 },
    );
  }
}

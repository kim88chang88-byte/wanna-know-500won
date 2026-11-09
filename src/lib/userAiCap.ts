import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { kstDay } from "@/lib/db/kst";
import { takeLimit } from "@/lib/guard";

/*
 * 회원 1명이 하루에 부를 수 있는 AI 풀이 수. 서버 전체 하루 상한(AI_DAILY_CAP)을 한 사람이 혼자 다 쓰지 못하게 해요.
 *  - normal: 일반 풀이·시간·MBTI·질문 등 (기본 30번, AI_USER_DAY_CAP 으로 바꿔요)
 *  - premium: 프리미엄 책의 AI 장 풀이 (기본 8번, AI_USER_PREMIUM_DAY_CAP)
 * 하루는 한국 시간 기준이에요. 관리자는 예외예요.
 */
export type CapBucket = "normal" | "premium";
const DEFAULTS: Record<CapBucket, number> = { normal: 30, premium: 8 };

export function userCapFor(bucket: CapBucket, env: Record<string, string | undefined> = process.env): number {
  const raw = (bucket === "normal" ? env.AI_USER_DAY_CAP : env.AI_USER_PREMIUM_DAY_CAP)?.trim();
  return raw && /^\d{1,4}$/.test(raw) && Number(raw) > 0 ? Number(raw) : DEFAULTS[bucket];
}

/** 하루 상한에 닿았으면 429 응답, 괜찮으면 null. (로그인하지 않은 요청은 다른 곳에서 막혀서 여기선 통과) */
export async function checkUserAiCap(request: Request, bucket: CapBucket, now: Date = new Date()): Promise<NextResponse | null> {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session || isAdmin(session.sub, process.env)) return null;
  const r = await takeLimit(`ai-day-${bucket}`, `u:${session.sub}:${kstDay(now)}`, userCapFor(bucket), 24 * 60 * 60);
  if (r.ok) return null;
  return NextResponse.json(
    { error: "오늘은 풀이를 많이 하셨어요. 내일 다시 만나요 ❄️", code: "user_day_cap" },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
  );
}

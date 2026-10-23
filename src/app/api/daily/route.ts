import { NextResponse } from "next/server";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { dailyLine } from "@/lib/daily/line";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { kstDay } from "@/lib/db/kst";
import { enforceLimits } from "@/lib/guard";
import { resolveBirth } from "@/lib/saju/birthPlace";
import { calculateSaju } from "@/lib/saju/calculate";

export const runtime = "nodejs";

/** 오늘의 도리 한마디. 저장된 생년월일시가 있는 로그인 회원만 받아요. AI 를 부르지 않아서 비용이 들지 않아요. */
export async function GET(request: Request) {
  const denied = await enforceLimits(request, { name: "daily", windowMs: 60000, ip: 30, user: 30 }, "잠시 뒤에 다시 열어 줘요.");
  if (denied) return denied;

  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  const dbConfig = loadDbConfig(process.env);
  if (!dbConfig) return NextResponse.json({ error: "지금은 열 수 없어요." }, { status: 503 });

  try {
    const profile = await createDb(dbConfig).getProfile(session.sub);
    if (!profile) return NextResponse.json({ error: "no_profile" }, { status: 404 });
    const chart = calculateSaju(resolveBirth(profile).input);
    const now = new Date();
    const result = dailyLine(buildDailyFacts(chart, kstToday(now)), kstDay(now));
    return NextResponse.json({ day: kstDay(now), ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("daily failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "오늘의 한마디를 불러오지 못했어요. 잠시 뒤에 다시 해줘요." }, { status: 502 });
  }
}

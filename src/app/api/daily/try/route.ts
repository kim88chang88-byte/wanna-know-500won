import { NextResponse } from "next/server";
import { buildDailyFacts, kstToday } from "@/lib/ai/dailyFacts";
import { dailyLine } from "@/lib/daily/line";
import { kstDay } from "@/lib/db/kst";
import { enforceLimits, guardOrigin } from "@/lib/guard";
import { calculateSaju } from "@/lib/saju/calculate";

export const runtime = "nodejs";

/**
 * 가입 없이 생년월일(양력)만으로 받아 보는 '오늘의 도리 한마디'. AI 를 부르지 않고, 아무것도 저장하지 않아요.
 * 일진과 일간의 관계만 쓰므로 태어난 시각·성별은 필요 없어요.
 */
export async function POST(request: Request) {
  const blocked = guardOrigin(request);
  if (blocked) return blocked;
  const denied = await enforceLimits(request, { name: "daily-try", windowMs: 60000, ip: 12, user: 12 }, "잠시 뒤에 다시 시도해 주세요.");
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as { year?: unknown; month?: unknown; day?: unknown } | null;
  const year = Number(body?.year);
  const month = Number(body?.month);
  const day = Number(body?.day);
  const valid =
    Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) &&
    year >= 1900 && year <= new Date().getUTCFullYear() && month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
    new Date(Date.UTC(year, month - 1, day)).getUTCMonth() === month - 1;
  if (!valid) return NextResponse.json({ error: "생년월일을 다시 확인해 주세요." }, { status: 400 });

  try {
    const chart = calculateSaju({ year, month, day, hour: null, calendar: "solar", gender: "female" });
    const now = new Date();
    const r = dailyLine(buildDailyFacts(chart, kstToday(now)), kstDay(now));
    return NextResponse.json({ day: kstDay(now), line: r.line, tip: r.tip, ganzhi: r.ganzhi }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "한마디를 만들지 못했어요. 잠시 뒤에 다시 시도해 주세요." }, { status: 502 });
  }
}

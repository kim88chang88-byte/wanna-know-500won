import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { estimateKrw } from "@/lib/ai/aiTools";
import { kstDay } from "@/lib/db/kst";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";
import { sinceDayFor } from "@/lib/admin/stats";

export const runtime = "nodejs";
export const maxDuration = 30;
const NO_STORE = { "Cache-Control": "no-store" };

/** 관리자 전용: 날짜·모델별 AI 호출 횟수, 캐시로 아낀 횟수, 대략의 비용(원). */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  const cfg = loadDbConfig(process.env);
  if (!cfg) return NextResponse.json({ error: "DB 가 연결되어 있지 않아." }, { status: 503, headers: NO_STORE });
  const now = new Date();
  try {
    const rows = await createDb(cfg).listAiCost(sinceDayFor(14, now));
    const today = kstDay(now);
    const withCost = rows.map((r) => ({ ...r, krw: estimateKrw(r.model, r.input, r.output) }));
    const sum = (list: typeof withCost) => ({
      calls: list.reduce((a, r) => a + r.calls, 0),
      cacheHits: list.reduce((a, r) => a + r.cacheHits, 0),
      krw: list.reduce((a, r) => a + (r.krw ?? 0), 0),
      unknownPrice: list.some((r) => r.krw === null && r.calls > 0),
    });
    return NextResponse.json({ today: sum(withCost.filter((r) => r.day === today)), total: sum(withCost), rows: withCost }, { headers: NO_STORE });
  } catch (err) {
    console.error("admin ai-usage failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "기록을 불러오지 못했어. (ai_cost 표를 만들었는지 확인해 줘)" }, { status: 502, headers: NO_STORE });
  }
}

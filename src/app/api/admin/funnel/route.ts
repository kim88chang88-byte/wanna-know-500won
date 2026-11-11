import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { sinceDayFor } from "@/lib/admin/stats";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createDb, loadDbConfig } from "@/lib/db/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;
const NO_STORE = { "Cache-Control": "no-store" };

/** 관리자 전용: 최근 N일 방문→행동 퍼널(전체와 출처별). */
export async function GET(request: Request) {
  const session = verifySessionToken(readCookie(request.headers.get("cookie"), SESSION_COOKIE), process.env.AUTH_SECRET);
  if (!session) return NextResponse.json({ error: "로그인이 필요해." }, { status: 401, headers: NO_STORE });
  if (!isAdmin(session.sub, process.env)) return NextResponse.json({ error: "관리자 권한이 없어." }, { status: 403, headers: NO_STORE });
  const cfg = loadDbConfig(process.env);
  if (!cfg) return NextResponse.json({ error: "DB 가 연결되어 있지 않아." }, { status: 503, headers: NO_STORE });
  const raw = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(raw) ? raw : 30;
  try {
    const db = createDb(cfg);
    const since = sinceDayFor(days, new Date());
    const rows = await db.visitFunnel(since);
    // 일별 추이는 함수를 아직 안 만들었어도 퍼널은 보이게 따로 시도해요
    const daily = await db.visitDaily(since).catch(() => []);
    return NextResponse.json({ days, rows, daily }, { headers: NO_STORE });
  } catch (err) {
    console.error("admin funnel failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "퍼널을 불러오지 못했어. (supabase/schema.sql 을 다시 Run 해야 기록이 쌓여)" }, { status: 502, headers: NO_STORE });
  }
}
